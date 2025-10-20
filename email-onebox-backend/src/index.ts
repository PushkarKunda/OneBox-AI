// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

// Now, import everything else
import express from 'express';
import cors from 'cors';
// import Imap from 'node-imap';
import { connectToImap } from './services/imap.service.mock';
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
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/emails', async (req, res) => {
    const query = (req.query.q as string) || '';
    const account = (req.query.account as string) || '';

    const emails = await searchEmails(query, account);
    res.json(emails);
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
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting RAG stats:', error);
      res.status(500).json({
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
    res.json({
      ...status,
      message: status.initialized
        ? 'Email service ready'
        : 'Email service in fallback mode',
    });
  });

  app.listen(API_PORT, () => {
    console.log(`✅ API server listening at http://localhost:${API_PORT}`);
  });
}

// --- Start the Application ---
startApp();
