// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

// Now, import everything else
import express from 'express';
import cors from 'cors';
import { performanceMiddleware, getPerformanceStats } from './middleware/performance.middleware';
import { connectToImap } from './services/imap.service';
import {
  createEmailIndexIfNotExists,
  searchEmails,
} from './services/elasticsearch.service';
import { EmailContext, ragService } from './services/rag.service';
import { vectorService } from './services/vector.service';
import { emailService } from './services/email.service';

// --- Configuration ---
interface EmailAccount {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { rejectUnauthorized: boolean };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const accounts: EmailAccount[] = [
  {
    user: process.env.IMAP_USER_1!,
    password: process.env.IMAP_PASSWORD_1!,
    host: process.env.IMAP_HOST_1!,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
  {
    user: process.env.IMAP_USER_2!,
    password: process.env.IMAP_PASSWORD_2!,
    host: process.env.IMAP_HOST_2!,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
];

const API_PORT = 3001;

/**
 * The main function to start the application.
 */
async function startApp() {
  console.log('🚀 Starting the Onebox application...');

  // 1. Ensure the Elasticsearch index is ready
  await createEmailIndexIfNotExists();

  // 2. Start the email syncing process for all accounts (mock implementation)
  accounts.forEach(accountConfig => {
    if (accountConfig.user && accountConfig.password && accountConfig.host) {
      connectToImap(accountConfig);
    }
  });

  // 3. Initialize RAG services
  console.log('🤖 Initializing AI services...');
  await vectorService.initialize();
  console.log('✅ AI services ready');

  // 4. Start the API Server to serve data to the frontend
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  // Add performance monitoring middleware
  app.use(performanceMiddleware);

  // Account management endpoints
  app.get('/api/accounts', (_req, res) => {
    const activeAccounts = accounts
      .filter(a => a.user && !a.user.includes('example.com'))
      .map(a => ({ user: a.user, host: a.host, status: 'connected' }));

    if (activeAccounts.length === 0) {
      activeAccounts.push({ user: 'demo@onebox.ai', host: 'imap.onebox.ai', status: 'connected' });
    }

    return res.json({ success: true, accounts: activeAccounts });
  });

  app.post('/api/accounts/connect', (req, res) => {
    const { user, password, host, provider } = req.body;

    if (!user) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const hostName =
      host ||
      (provider === 'gmail'
        ? 'imap.gmail.com'
        : provider === 'outlook'
        ? 'outlook.office365.com'
        : 'imap.mail.yahoo.com');

    const newAccount: EmailAccount = {
      user,
      password: password || 'demo-pass',
      host: hostName,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };

    accounts.push(newAccount);

    if (password && hostName && !password.includes('your-app-password')) {
      try {
        connectToImap(newAccount);
      } catch (err: any) {
        console.warn(`Could not connect IMAP for ${user}:`, err.message);
      }
    }

    return res.json({
      success: true,
      message: `Account ${user} connected successfully`,
      account: { user: newAccount.user, host: newAccount.host, status: 'connected' },
    });
  });

  app.get('/api/emails', async (req, res) => {
    const query = (req.query.q as string) || '';
    const account = (req.query.account as string) || '';
    const isSemantic = req.query.semantic === 'true';

    let emails = await searchEmails(query, account);

    if (isSemantic && query.trim().length > 0) {
      const semanticResults = await vectorService.semanticSearchEmails(query, emails);
      emails = semanticResults.map(item => {
        const copy = JSON.parse(JSON.stringify(item.email));
        if (copy._source) {
          copy._source.similarityScore = item.similarity;
          copy._source.matchReason = item.matchReason;
        } else {
          copy.similarityScore = item.similarity;
          copy.matchReason = item.matchReason;
        }
        return copy;
      });
    }

    return res.json(emails);
  });

  // Reply suggestion endpoint
  app.post('/api/suggest-replies', async (req, res) => {
    try {
      const email: EmailContext = req.body;

      // Validate required fields
      if (!email.subject || !email.body || !email.from) {
        return res.status(400).json({
          error: 'Missing required email fields: subject, body, from',
        });
      }

      console.log(`💬 Generating reply suggestions for: ${email.subject}`);

      const suggestions = await ragService.generateReplySuggestions(email);

      return res.json({
        success: true,
        email_id: email.subject,
        suggestions: suggestions,
        generated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating reply suggestions:', error);
      return res.status(500).json({
        error: 'Failed to generate reply suggestions',
        details: error.message,
      });
    }
  });

  // RAG service stats endpoint
  app.get('/api/rag-stats', async (_req, res) => {
    try {
      const stats = await ragService.getStats();
      return res.json(stats);
    } catch (error: any) {
      console.error('Error getting RAG stats:', error);
      return res.status(500).json({
        error: 'Failed to get RAG statistics',
        details: error.message,
      });
    }
  });

  // Send email endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const { from, to, cc, bcc, subject, body, priority } = req.body;

      // Validate required fields
      if (!from || !to || !subject) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: from, to, subject',
        });
      }

      console.log(
        `📧 Attempting to send email from ${from} to ${to}: ${subject}`,
      );

      // Use real email service
      const result = await emailService.sendEmail({
        from,
        to,
        cc,
        bcc,
        subject,
        body,
        priority,
      });

      if (result.success) {
        return res.json({
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email',
        });
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: error.message,
      });
    }
  });

  // Test email endpoint
  app.post('/api/test-email', async (req, res) => {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: to',
        });
      }

      const result = await emailService.sendTestEmail(to);

      if (result.success) {
        return res.json({
          success: true,
          messageId: result.messageId,
          message: 'Test email sent successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send test email',
        });
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: error.message,
      });
    }
  });

  // Email service status endpoint
  app.get('/api/email-status', (_req, res) => {
    const status = emailService.getStatus();
    return res.json({
      ...status,
      message: status.initialized
        ? 'Email service ready'
        : 'Email service in fallback mode',
    });
  });

  // Performance monitoring endpoint
  app.get('/api/performance', (_req, res) => {
    const stats = getPerformanceStats();
    return res.json({
      success: true,
      performance: stats,
      timestamp: new Date().toISOString()
    });
  });

  app.listen(API_PORT, () => {
    console.log(`✅ API server listening at http://localhost:${API_PORT}`);
  });
}

// --- Start the Application ---
startApp();
