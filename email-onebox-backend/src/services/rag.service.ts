import OpenAI from 'openai';
import { vectorService } from './vector.service';

interface EmailContext {
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
}

interface SuggestedReply {
  id: string;
  content: string;
  confidence: number;
  context: {
    relevantKnowledge: any[];
    matchedTemplate: any;
    reasoning: string;
  };
  metadata: {
    category: string;
    tone: 'professional' | 'friendly' | 'formal';
    action_required: boolean;
    estimated_response_time: string;
  };
}

class RAGService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze email content to understand context and intent
   */
  private async analyzeEmailIntent(email: EmailContext): Promise<string> {
    const prompt = `
Analyze this email and classify the intent in one sentence:

Subject: ${email.subject}
From: ${email.from}
Content: ${email.body}

What is the main intent or request in this email? Respond with a single sentence describing the intent.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1,
      });

      return response.choices[0].message?.content?.trim() || 'General inquiry';
    } catch (error) {
      console.error('Error analyzing email intent:', error);
      return 'General inquiry';
    }
  }

  /**
   * Generate contextual reply suggestions using RAG
   */
  async generateReplySuggestions(
    email: EmailContext,
  ): Promise<SuggestedReply[]> {
    try {
      console.log(`🤖 Generating reply suggestions for: ${email.subject}`);

      // Step 1: Analyze email intent
      const intent = await this.analyzeEmailIntent(email);
      console.log(`📝 Detected intent: ${intent}`);

      // Step 2: Retrieve relevant knowledge from vector database
      const searchQuery = `${email.subject} ${email.body} ${intent}`;
      const [knowledgeResults, templateResults] = await Promise.all([
        vectorService.searchKnowledge(searchQuery, 3),
        vectorService.searchReplyTemplates(searchQuery, 2),
      ]);

      console.log(
        `📚 Found ${knowledgeResults.length} knowledge items, ${templateResults.length} templates`,
      );

      // Step 3: Generate multiple reply suggestions
      const suggestions: SuggestedReply[] = [];

      // Generate template-based suggestion if good match found
      if (templateResults.length > 0 && templateResults[0].similarity > 0.7) {
        const templateSuggestion = await this.generateTemplateBasedReply(
          email,
          templateResults[0],
          knowledgeResults,
        );
        suggestions.push(templateSuggestion);
      }

      // Generate AI-powered contextual suggestion
      const aiSuggestion = await this.generateAIContextualReply(
        email,
        knowledgeResults,
        templateResults,
        intent,
      );
      suggestions.push(aiSuggestion);

      // Generate quick response if appropriate
      const quickResponse = await this.generateQuickResponse(email, intent);
      if (quickResponse) {
        suggestions.push(quickResponse);
      }

      console.log(`✅ Generated ${suggestions.length} reply suggestions`);
      return suggestions;
    } catch (error) {
      console.error('Error generating reply suggestions:', error);

      // Return fallback suggestion
      return [
        {
          id: 'fallback',
          content:
            'Thank you for your email. I will review your message and get back to you soon.',
          confidence: 0.5,
          context: {
            relevantKnowledge: [],
            matchedTemplate: null,
            reasoning: 'Fallback response due to processing error',
          },
          metadata: {
            category: 'general',
            tone: 'professional',
            action_required: true,
            estimated_response_time: '24 hours',
          },
        },
      ];
    }
  }

  /**
   * Generate reply based on matched template
   */
  private async generateTemplateBasedReply(
    email: EmailContext,
    template: any,
    knowledgeResults: any[],
  ): Promise<SuggestedReply> {
    // Customize template with context
    let customizedReply = template.template;

    // Replace common variables
    const variables = {
      meeting_link: process.env.MEETING_LINK || 'https://cal.com/example',
      product_name: 'OneBox-AI',
      sender_name: email.from.split('@')[0] || 'there',
    };

    Object.entries(variables).forEach(([key, value]) => {
      customizedReply = customizedReply.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value,
      );
    });

    return {
      id: `template_${Date.now()}`,
      content: customizedReply,
      confidence: template.similarity,
      context: {
        relevantKnowledge: knowledgeResults.slice(0, 2),
        matchedTemplate: template,
        reasoning: `Matched template for ${template.category} scenario with ${Math.round(template.similarity * 100)}% confidence`,
      },
      metadata: {
        category: template.category,
        tone: 'professional',
        action_required: customizedReply.includes('http'),
        estimated_response_time: 'immediate',
      },
    };
  }

  /**
   * Generate AI-powered contextual reply
   */
  private async generateAIContextualReply(
    email: EmailContext,
    knowledgeResults: any[],
    templateResults: any[],
    intent: string,
  ): Promise<SuggestedReply> {
    const contextInfo = knowledgeResults.map(item => item.content).join('\n');

    const templateContext = templateResults
      .map(t => `Scenario: ${t.scenario}\nTemplate: ${t.template}`)
      .join('\n\n');

    const prompt = `
You are an AI assistant helping to compose professional email replies. 

CONTEXT INFORMATION:
${contextInfo}

AVAILABLE TEMPLATES:
${templateContext}

INCOMING EMAIL:
Subject: ${email.subject}
From: ${email.from}
Content: ${email.body}

DETECTED INTENT: ${intent}

Generate a professional, contextual reply that:
1. Acknowledges the sender's message appropriately
2. Uses relevant information from the context when applicable
3. Maintains a professional but friendly tone
4. Includes specific details or links when relevant (e.g., https://cal.com/example for meetings)
5. Is concise and actionable

Reply:
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content =
        response.choices[0].message?.content?.trim() ||
        "Thank you for your email. I'll review your message and respond accordingly.";

      return {
        id: `ai_${Date.now()}`,
        content,
        confidence: 0.8,
        context: {
          relevantKnowledge: knowledgeResults,
          matchedTemplate: templateResults[0] || null,
          reasoning:
            'AI-generated response using retrieved context and templates',
        },
        metadata: {
          category: this.categorizeEmail(email, intent),
          tone: 'professional',
          action_required:
            content.includes('http') || content.includes('schedule'),
          estimated_response_time: 'immediate',
        },
      };
    } catch (error) {
      console.error('Error generating AI contextual reply:', error);
      throw error;
    }
  }

  /**
   * Generate quick response for simple emails
   */
  private async generateQuickResponse(
    email: EmailContext,
    _intent: string,
  ): Promise<SuggestedReply | null> {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    // Quick responses for common scenarios
    if (subject.includes('thank') || body.includes('thank you')) {
      return {
        id: `quick_${Date.now()}`,
        content:
          "You're welcome! Feel free to reach out if you have any other questions.",
        confidence: 0.9,
        context: {
          relevantKnowledge: [],
          matchedTemplate: null,
          reasoning: 'Quick response for thank you message',
        },
        metadata: {
          category: 'acknowledgment',
          tone: 'friendly',
          action_required: false,
          estimated_response_time: 'immediate',
        },
      };
    }

    if (subject.includes('confirm') || body.includes('confirm')) {
      return {
        id: `quick_${Date.now()}`,
        content:
          "Confirmed! I'll make a note of this. Thank you for letting me know.",
        confidence: 0.8,
        context: {
          relevantKnowledge: [],
          matchedTemplate: null,
          reasoning: 'Quick response for confirmation request',
        },
        metadata: {
          category: 'confirmation',
          tone: 'professional',
          action_required: false,
          estimated_response_time: 'immediate',
        },
      };
    }

    return null;
  }

  /**
   * Categorize email based on content and intent
   */
  private categorizeEmail(email: EmailContext, _intent: string): string {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    if (subject.includes('interview') || body.includes('interview')) {
      return 'job_interview';
    }
    if (subject.includes('meeting') || body.includes('meeting')) {
      return 'meeting';
    }
    if (subject.includes('demo') || body.includes('demo')) {
      return 'sales_demo';
    }
    if (subject.includes('support') || body.includes('help')) {
      return 'technical_support';
    }
    if (subject.includes('collaboration') || body.includes('project')) {
      return 'collaboration';
    }

    return 'general';
  }

  /**
   * Get RAG service statistics
   */
  async getStats(): Promise<any> {
    const vectorStats = await vectorService.getStats();

    return {
      ...vectorStats,
      ragService: 'active',
      llmModel: 'gpt-3.5-turbo',
      embeddingModel: 'text-embedding-ada-002',
    };
  }
}

export const ragService = new RAGService();
export { RAGService };
export type { EmailContext, SuggestedReply };
