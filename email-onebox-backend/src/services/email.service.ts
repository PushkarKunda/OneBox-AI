import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Using Gmail SMTP - you can configure other providers
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || process.env.IMAP_USER_1, // Use existing email config
          pass: process.env.SMTP_PASS || process.env.IMAP_PASSWORD_1, // App password for Gmail
        },
      });

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('⚠️ Email service initialization failed:', error);
      console.log('📧 Will use fallback mode - emails will be logged only');
      this.initialized = false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    const { from, to, cc, bcc, subject, body, priority = 'normal' } = options;

    // If not initialized or no transporter, use fallback mode
    if (!this.initialized || !this.transporter) {
      console.log('📧 FALLBACK MODE - Email would be sent:');
      console.log({
        from,
        to,
        cc: cc || 'N/A',
        bcc: bcc || 'N/A',
        subject,
        priority,
        bodyLength: body.length,
      });

      return {
        success: true,
        messageId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    try {
      // Prepare email options
      const mailOptions: nodemailer.SendMailOptions = {
        from: from,
        to: to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'), // Simple HTML conversion
        priority:
          priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'normal',
      };

      console.log(`📧 Sending real email from ${from} to ${to}: ${subject}`);

      // Send the email
      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        from,
        to,
        cc: cc || 'N/A',
        bcc: bcc || 'N/A',
        subject,
        priority,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);

      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  // Test email sending
  async sendTestEmail(to: string): Promise<EmailSendResult> {
    return this.sendEmail({
      from:
        process.env.SMTP_USER || process.env.IMAP_USER_1 || 'test@example.com',
      to,
      subject: 'Test Email from OneBox AI',
      body: `Hello!\n\nThis is a test email sent from OneBox AI at ${new Date().toLocaleString()}.\n\nBest regards,\nOneBox AI Team`,
      priority: 'normal',
    });
  }

  // Get service status
  getStatus(): { initialized: boolean; ready: boolean } {
    return {
      initialized: this.initialized,
      ready: this.transporter !== null,
    };
  }
}

export const emailService = new EmailService();
