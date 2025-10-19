import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Email {
  _id: string;
  _source: {
    messageId: string;
    from: string;
    to: string[];
    subject: string;
    date: string;
    body: string;
    account: string;
    boxName: string;
  };
}

export interface EmailSearchResponse {
  hits: {
    hits: Email[];
    total: {
      value: number;
    };
  };
}

export interface EmailContext {
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
}

export interface SuggestedReply {
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

export interface ReplySuggestionsResponse {
  success: boolean;
  email_id: string;
  suggestions: SuggestedReply[];
  generated_at: string;
}

export const emailService = {
  searchEmails: async (query: string = '', account: string = ''): Promise<Email[]> => {
    try {
      console.log('Making API request to:', `${API_BASE_URL}/emails`, { q: query, account });
      
      const response = await api.get<any>('/emails', {
        params: {
          q: query,
          account: account
        }
      });
      
      console.log('API Response:', response.data);
      
      // Handle different response formats
      if (response.data && response.data.hits && response.data.hits.hits) {
        // Elasticsearch format
        return response.data.hits.hits;
      } else if (Array.isArray(response.data)) {
        // Direct array format (current backend)
        return response.data.map((email: any) => ({
          _id: email._id || email.messageId || Math.random().toString(),
          _source: {
            messageId: email.messageId || email._id,
            from: email.from,
            to: Array.isArray(email.to) ? email.to : [email.to],
            subject: email.subject,
            date: email.date,
            body: email.text || email.body || '',
            account: email.account || 'Unknown',
            boxName: email.boxName || 'INBOX'
          }
        }));
      } else {
        console.warn('Unexpected response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching emails:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        fullError: error
      });
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  },
  
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await api.get('/emails', { params: { q: '', account: '' } });
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  generateReplySuggestions: async (email: EmailContext): Promise<SuggestedReply[]> => {
    try {
      console.log('Requesting reply suggestions for:', email.subject);
      
      const response = await api.post<ReplySuggestionsResponse>('/suggest-replies', email);
      
      if (response.data.success) {
        console.log(`Generated ${response.data.suggestions.length} reply suggestions`);
        return response.data.suggestions;
      } else {
        throw new Error('Failed to generate reply suggestions');
      }
    } catch (error: any) {
      console.error('Error generating reply suggestions:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw new Error(`Failed to generate reply suggestions: ${error.response?.data?.error || error.message}`);
    }
  },

  getRagStats: async (): Promise<any> => {
    try {
      const response = await api.get('/rag-stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RAG stats:', error);
      throw new Error(`Failed to fetch RAG stats: ${error.message}`);
    }
  }
};
