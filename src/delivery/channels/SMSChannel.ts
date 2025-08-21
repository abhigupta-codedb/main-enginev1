import twilio from 'twilio';
import { IDeliveryChannel, SMSData, DeliveryResult } from './IDeliveryChannel';

export class SMSChannel implements IDeliveryChannel {
  private static client: twilio.Twilio | null = null;

  // Implementation of IDeliveryChannel interface
  async send(data: any): Promise<void> {
    const result = await SMSChannel.send(data as SMSData);
    if (!result.success) {
      throw new Error(result.error || 'SMS delivery failed');
    }
  }

  private static getClient(): twilio.Twilio {
    if (this.client) {
      return this.client;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }

    this.client = twilio(accountSid, authToken);
    return this.client;
  }

  static async send(data: SMSData): Promise<DeliveryResult> {
    try {
      // Validate required data
      if (!data.to || !data.message) {
        throw new Error('Phone number and message are required');
      }

      // Format phone number (ensure it starts with +)
      const phoneNumber = this.formatPhoneNumber(data.to);
      
      // Get Twilio client
      const client = this.getClient();
      
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        throw new Error('Twilio phone number not configured. Please set TWILIO_PHONE_NUMBER environment variable.');
      }

      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' && process.env.SMS_DEV_MODE === 'true') {
        console.log('📱 [DEV MODE] SMS would be sent:');
        console.log(`   To: ${phoneNumber}`);
        console.log(`   From: ${fromNumber}`);
        console.log(`   Message: ${data.message}`);
        
        return {
          success: true,
          messageId: `dev-sms-${Date.now()}`,
          timestamp: new Date()
        };
      }

      // Send SMS
      const message = await client.messages.create({
        body: data.message,
        from: fromNumber,
        to: phoneNumber,
      });

      console.log(`📱✅ SMS sent successfully to ${phoneNumber}, Message SID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
        timestamp: new Date()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMS error';
      console.error(`📱❌ SMS delivery failed to ${data.to}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume US (+1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has country code but no +, add it
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  }

  // Validate phone number format
  static isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    // Should be at least 10 digits (US) or up to 15 digits (international)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Test SMS configuration
  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      
      // Test by fetching account info
      const account = await client.api.accounts(client.accountSid).fetch();
      
      console.log(`📱✅ Twilio connection verified. Account: ${account.friendlyName}`);
      return true;
    } catch (error) {
      console.error('📱❌ Twilio connection failed:', error);
      return false;
    }
  }

  // Get SMS delivery status (for tracking)
  static async getMessageStatus(messageSid: string): Promise<string | null> {
    try {
      const client = this.getClient();
      const message = await client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      console.error(`📱❌ Failed to get message status for ${messageSid}:`, error);
      return null;
    }
  }
}
