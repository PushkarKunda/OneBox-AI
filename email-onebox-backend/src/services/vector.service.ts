import { ChromaClient, EmbeddingFunction } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

interface KnowledgeItem {
  id: string;
  content: string;
  category: string;
  metadata: {
    type: 'product' | 'outreach' | 'template' | 'faq';
    tags: string[];
    priority: number;
    context?: string;
  };
}

interface ReplyTemplate {
  id: string;
  scenario: string;
  template: string;
  variables: string[];
  category: string;
}

// Custom embedding function for ChromaDB
class CustomEmbeddingFunction implements EmbeddingFunction {
  private vectorService: VectorService;

  constructor(vectorService: VectorService) {
    this.vectorService = vectorService;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings = [];
    for (const text of texts) {
      try {
        const embedding = await this.vectorService.generateEmbeddings(text);
        embeddings.push(embedding);
      } catch (error) {
        console.error('Error in custom embedding function:', error);
        // Use fallback embedding
        const fallbackEmbedding =
          this.vectorService.generateFallbackEmbedding(text);
        embeddings.push(fallbackEmbedding);
      }
    }
    return embeddings;
  }
}

class VectorService {
  private chromaClient: ChromaClient;
  private openai: OpenAI;
  private knowledgeCollection: any;
  private templatesCollection: any;
  private rateLimitDelay: number = 1000; // Start with 1 second delay
  private lastRequestTime: number = 0;
  private embeddingFunction: CustomEmbeddingFunction;
  private isConnected: boolean = false;

  constructor() {
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create custom embedding function
    this.embeddingFunction = new CustomEmbeddingFunction(this);
  }

  /**
   * Initialize the vector service and seed data
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeCollections();
      this.isConnected = true;

      // Check if knowledge base is empty and seed if needed
      try {
        const stats = await this.getStats();
        if (stats.knowledgeItems === 0) {
          await this.seedKnowledgeBase();
        }
      } catch (error) {
        console.log(
          'Knowledge base not found, will seed after collections are ready',
        );
        await this.seedKnowledgeBase();
      }
    } catch (error) {
      console.warn(
        '⚠️ ChromaDB not available. Running in fallback mode without vector search.',
      );
      this.isConnected = false;
    }
  }

  private async initializeCollections() {
    // Create or get knowledge base collection with custom embedding function
    this.knowledgeCollection = await this.chromaClient.getOrCreateCollection({
      name: 'knowledge_base',
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: this.embeddingFunction,
    });

    // Create or get reply templates collection with custom embedding function
    this.templatesCollection = await this.chromaClient.getOrCreateCollection({
      name: 'reply_templates',
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: this.embeddingFunction,
    });

    console.log('✅ Vector collections initialized successfully');
  }

  /**
   * Rate limiting helper
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(
        `⏳ Rate limiting: waiting ${waitTime}ms before next request`,
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Generate embeddings using OpenAI with retry logic and rate limiting
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await this.waitForRateLimit();

        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        });

        // Reset rate limit delay on successful request
        this.rateLimitDelay = Math.max(1000, this.rateLimitDelay * 0.9);

        return response.data[0].embedding;
      } catch (error: any) {
        if (error.status === 429) {
          // Rate limit exceeded
          retries++;
          this.rateLimitDelay = Math.min(30000, this.rateLimitDelay * 2); // Exponential backoff up to 30s

          if (retries < maxRetries) {
            console.log(
              `⚠️ Rate limit hit (attempt ${retries}/${maxRetries}). Retrying in ${this.rateLimitDelay}ms...`,
            );
            await new Promise(resolve =>
              setTimeout(resolve, this.rateLimitDelay),
            );
            continue;
          } else {
            console.error(
              '❌ Max retries exceeded for OpenAI API. Using fallback embedding.',
            );
            return this.generateFallbackEmbedding(text);
          }
        } else if (error.code === 'insufficient_quota') {
          console.error('❌ OpenAI quota exceeded. Using fallback embedding.');
          return this.generateFallbackEmbedding(text);
        } else {
          console.error('Error generating embeddings:', error);
          throw error;
        }
      }
    }

    // This should never be reached, but just in case
    return this.generateFallbackEmbedding(text);
  }

  /**
   * Simple fallback embedding using text hashing (for development/testing)
   */
  generateFallbackEmbedding(text: string): number[] {
    console.log(
      '🔄 Using fallback embedding for:',
      text.substring(0, 50) + '...',
    );

    // Create a simple hash-based embedding
    const embedding = new Array(1536).fill(0); // Match OpenAI embedding dimensions

    // Simple hash function to create pseudo-embedding
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const index = (char + i) % embedding.length;
      embedding[index] += Math.sin(char * i) * 0.01;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Add knowledge item to vector database
   */
  async addKnowledgeItem(item: Omit<KnowledgeItem, 'id'>): Promise<string> {
    const id = uuidv4();

    if (!this.isConnected) {
      console.log(
        `⚠️ ChromaDB unavailable. Skipping knowledge item: ${item.category}`,
      );
      return id;
    }

    // Use ChromaDB's embedding function (which will call our custom function)
    await this.knowledgeCollection.add({
      ids: [id],
      documents: [item.content],
      metadatas: [item.metadata],
    });

    console.log(`✅ Added knowledge item: ${item.category}`);
    return id;
  }

  /**
   * Add reply template to vector database
   */
  async addReplyTemplate(template: Omit<ReplyTemplate, 'id'>): Promise<string> {
    const id = uuidv4();
    const searchText = `${template.scenario} ${template.template}`;

    if (!this.isConnected) {
      console.log(
        `⚠️ ChromaDB unavailable. Skipping reply template: ${template.category}`,
      );
      return id;
    }

    // Use ChromaDB's embedding function (which will call our custom function)
    await this.templatesCollection.add({
      ids: [id],
      documents: [searchText],
      metadatas: [
        {
          scenario: template.scenario,
          template: template.template,
          variables: template.variables,
          category: template.category,
        },
      ],
    });

    console.log(`✅ Added reply template: ${template.category}`);
    return id;
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledge(query: string, limit: number = 3): Promise<any[]> {
    if (!this.isConnected) {
      console.log(
        '⚠️ ChromaDB unavailable. Returning fallback knowledge results.',
      );
      return this.getFallbackKnowledge(query, limit);
    }

    // Use ChromaDB's text-based query (which will use our custom embedding function)
    const results = await this.knowledgeCollection.query({
      queryTexts: [query],
      nResults: limit,
      include: ['documents', 'metadatas', 'distances'],
    });

    return results.documents[0].map((doc: string, index: number) => ({
      content: doc,
      metadata: results.metadatas[0][index],
      similarity: 1 - results.distances[0][index],
    }));
  }

  /**
   * Search reply templates for relevant templates
   */
  async searchReplyTemplates(query: string, limit: number = 2): Promise<any[]> {
    if (!this.isConnected) {
      console.log(
        '⚠️ ChromaDB unavailable. Returning fallback reply templates.',
      );
      return this.getFallbackReplyTemplates(query, limit);
    }

    // Use ChromaDB's text-based query (which will use our custom embedding function)
    const results = await this.templatesCollection.query({
      queryTexts: [query],
      nResults: limit,
      include: ['documents', 'metadatas', 'distances'],
    });

    return results.metadatas[0].map((metadata: any, index: number) => ({
      scenario: metadata.scenario,
      template: metadata.template,
      variables: metadata.variables,
      category: metadata.category,
      similarity: 1 - results.distances[0][index],
    }));
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<any> {
    if (!this.isConnected) {
      return {
        knowledgeItems: 0,
        replyTemplates: 0,
        status: 'disconnected',
      };
    }

    const knowledgeCount = await this.knowledgeCollection.count();
    const templatesCount = await this.templatesCollection.count();

    return {
      knowledgeItems: knowledgeCount,
      replyTemplates: templatesCount,
      status: 'active',
    };
  }

  /**
   * Fallback knowledge search when ChromaDB is unavailable
   */
  private getFallbackKnowledge(_query: string, limit: number): any[] {
    const fallbackItems = [
      {
        content:
          'Our AI-powered email management platform OneBox-AI helps businesses organize, classify, and respond to emails intelligently using machine learning.',
        metadata: {
          type: 'product',
          tags: ['AI', 'email', 'management'],
          priority: 1,
        },
        similarity: 0.8,
      },
      {
        content:
          'Key features: Multi-account IMAP sync, AI email classification, Elasticsearch integration, webhook notifications, modern React frontend, dark/light themes.',
        metadata: {
          type: 'product',
          tags: ['features', 'IMAP', 'AI'],
          priority: 1,
        },
        similarity: 0.7,
      },
      {
        content:
          'Technical stack: Node.js, Express, TypeScript, React 18, Elasticsearch, Hugging Face AI, ChromaDB for vector search.',
        metadata: {
          type: 'product',
          tags: ['tech stack', 'Node.js', 'React'],
          priority: 2,
        },
        similarity: 0.6,
      },
    ];

    return fallbackItems.slice(0, limit);
  }

  /**
   * Fallback reply templates when ChromaDB is unavailable
   */
  private getFallbackReplyTemplates(_query: string, limit: number): any[] {
    const fallbackTemplates = [
      {
        scenario: 'Job application follow-up when interviewer shows interest',
        template:
          "Thank you for your interest in my application! I'm excited about the opportunity to discuss how I can contribute to your team. You can schedule a convenient time for our interview here: https://cal.com/example",
        variables: ['meeting_link'],
        category: 'job_interview',
        similarity: 0.8,
      },
      {
        scenario: 'Product demo request from potential client',
        template:
          "Thank you for your interest in OneBox-AI! I'd be delighted to show you how our AI-powered email management platform can streamline your workflow. You can book a demo session here: https://cal.com/example",
        variables: ['meeting_link', 'product_name'],
        category: 'sales_demo',
        similarity: 0.7,
      },
    ];

    return fallbackTemplates.slice(0, limit);
  }

  /**
   * Seed initial knowledge base
   */
  async seedKnowledgeBase(): Promise<void> {
    if (!this.isConnected) {
      console.log('⚠️ ChromaDB unavailable. Skipping knowledge base seeding.');
      return;
    }

    console.log('🌱 Seeding knowledge base...');

    // Product information
    const productInfo = [
      {
        content:
          'Our AI-powered email management platform OneBox-AI helps businesses organize, classify, and respond to emails intelligently using machine learning.',
        category: 'product_overview',
        metadata: {
          type: 'product' as const,
          tags: ['AI', 'email', 'management', 'automation'],
          priority: 1,
        },
      },
      {
        content:
          'Key features: Multi-account IMAP sync, AI email classification, Elasticsearch integration, webhook notifications, modern React frontend, dark/light themes.',
        category: 'product_features',
        metadata: {
          type: 'product' as const,
          tags: ['features', 'IMAP', 'AI', 'frontend'],
          priority: 1,
        },
      },
      {
        content:
          'Technical stack: Node.js, Express, TypeScript, React 18, Elasticsearch, Hugging Face AI, ChromaDB for vector search.',
        category: 'technical_specs',
        metadata: {
          type: 'product' as const,
          tags: ['tech stack', 'Node.js', 'React', 'AI'],
          priority: 2,
        },
      },
    ];

    // Outreach templates and responses
    const outreachTemplates = [
      {
        scenario: 'Job application follow-up when interviewer shows interest',
        template:
          "Thank you for your interest in my application! I'm excited about the opportunity to discuss how I can contribute to your team. You can schedule a convenient time for our interview here: https://cal.com/example",
        variables: ['meeting_link'],
        category: 'job_interview',
      },
      {
        scenario: 'Meeting request response for project collaboration',
        template:
          "I'd be happy to discuss the collaboration opportunity! Please find my available slots for a meeting: https://cal.com/example",
        variables: ['meeting_link', 'project_name'],
        category: 'collaboration',
      },
      {
        scenario: 'Product demo request from potential client',
        template:
          "Thank you for your interest in OneBox-AI! I'd be delighted to show you how our AI-powered email management platform can streamline your workflow. You can book a demo session here: https://cal.com/example",
        variables: ['meeting_link', 'product_name'],
        category: 'sales_demo',
      },
      {
        scenario: 'Technical support inquiry response',
        template:
          "I'd be happy to help you with your technical question about OneBox-AI. Let's schedule a quick call to discuss your specific needs: https://cal.com/example",
        variables: ['meeting_link', 'issue_type'],
        category: 'technical_support',
      },
    ];

    // Add knowledge items
    for (const item of productInfo) {
      await this.addKnowledgeItem(item);
    }

    // Add reply templates
    for (const template of outreachTemplates) {
      await this.addReplyTemplate(template);
    }

    console.log('✅ Knowledge base seeded successfully');
  }
}

export const vectorService = new VectorService();
export { VectorService };
export type { KnowledgeItem, ReplyTemplate };
