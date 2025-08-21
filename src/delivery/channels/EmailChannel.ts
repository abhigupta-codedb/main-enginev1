import nodemailer from 'nodemailer';
import { IDeliveryChannel, EmailData, DeliveryResult } from './IDeliveryChannel';

export class EmailChannel implements IDeliveryChannel {
  private static transporter: nodemailer.Transporter | null = null;

  // Implementation of IDeliveryChannel interface
  async send(data: any): Promise<void> {
    const result = await EmailChannel.send(data as EmailData);
    if (!result.success) {
      throw new Error(result.error || 'Email delivery failed');
    }
  }

  private static createTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Configure based on environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    // For development, use Ethereal (fake SMTP service)
    if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      console.log('📧 Using development email mode - emails will be logged to console');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    } else {
      this.transporter = nodemailer.createTransport(emailConfig);
    }

    return this.transporter;
  }

  static async send(data: EmailData): Promise<DeliveryResult> {
    try {
      const transporter = this.createTransporter();

      // Validate required data
      if (!data.to || !data.content) {
        throw new Error('Email address and content are required');
      }

      // Prepare email content
      const htmlContent = this.formatEmailContent(data.content, data.recipientName);
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@deadhand.com',
        to: data.to,
        subject: data.subject || 'You have a scheduled note',
        text: data.content, // Plain text version
        html: htmlContent, // HTML version
      };

      // Add attachment if provided
      if (data.attachment) {
        mailOptions.attachments = [{
          filename: 'attachment.txt', // You might want to detect file type
          content: data.attachment,
          contentType: 'text/plain'
        }];
      }

      // Send email
      if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        // In development mode without real SMTP, just log
        console.log('📧 [DEV MODE] Email would be sent:');
        console.log(`   To: ${data.to}`);
        console.log(`   Subject: ${mailOptions.subject}`);
        console.log(`   Content: ${data.content}`);
        
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
          timestamp: new Date()
        };
      }

      const info = await transporter.sendMail(mailOptions);
      
      console.log(`📧✅ Email sent successfully to ${data.to}, Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
      console.error(`📧❌ Email delivery failed to ${data.to}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  private static formatEmailContent(content: string, recipientName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Scheduled Note</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .footer {
            font-size: 12px;
            color: #6c757d;
            text-align: center;
            padding: 10px;
          }
          .note-content {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #007bff;
            margin: 15px 0;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📝 Scheduled Note Delivery</h2>
          <p>Hello ${recipientName || 'there'}!</p>
        </div>
        
        <div class="content">
          <p>You have received a scheduled note:</p>
          
          <div class="note-content">
            ${content.replace(/\n/g, '<br>')}
          </div>
          
          <p>This note was scheduled for delivery and sent automatically.</p>
        </div>
        
        <div class="footer">
          <p>Delivered by Dead Hand Note System | ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      console.log('📧✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('📧❌ SMTP connection failed:', error);
      return false;
    }
  }
}
