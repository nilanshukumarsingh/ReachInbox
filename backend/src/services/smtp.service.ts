import nodemailer from 'nodemailer';

interface SendMailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendMailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

class SmtpService {
  private transporter: nodemailer.Transporter | null = null;
  private etherealAccount: nodemailer.TestAccount | null = null;
  private isInitializing = false;

  public async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
      while (this.isInitializing) {
        await new Promise((res) => setTimeout(res, 100));
      }
      if (this.transporter) return this.transporter;
    }

    this.isInitializing = true;
    try {
      console.log('🔄 [SMTP] Creating Ethereal Email test account...');
      this.etherealAccount = await nodemailer.createTestAccount();
      console.log('✅ [SMTP] Ethereal test account created:', this.etherealAccount.user);

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass,
        },
      });

      return this.transporter;
    } catch (error: any) {
      console.error('❌ [SMTP] Failed to initialize Ethereal SMTP:', error.message);
      // Fallback json transport for offline resilience
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return this.transporter;
    } finally {
      this.isInitializing = false;
    }
  }

  public async sendEmail(params: SendMailParams): Promise<SendMailResult> {
    try {
      const transporter = await this.getTransporter();

      const info = await transporter.sendMail({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>?/gm, ''),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📬 [SMTP] Email sent to ${params.to}! View preview: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
      };
    } catch (error: any) {
      console.error(`❌ [SMTP Error] Failed sending to ${params.to}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const smtpService = new SmtpService();
