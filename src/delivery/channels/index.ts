export { EmailChannel } from './EmailChannel';
export { SMSChannel } from './SMSChannel';
export { 
  IDeliveryChannel, 
  EmailData, 
  SMSData, 
  DeliveryResult 
} from './IDeliveryChannel';

// Channel factory for easy access
export class ChannelFactory {
  static getEmailChannel(): EmailChannel {
    return new EmailChannel();
  }

  static getSMSChannel(): SMSChannel {
    return new SMSChannel();
  }

  static async testAllChannels(): Promise<{ email: boolean; sms: boolean }> {
    const emailTest = await EmailChannel.testConnection();
    const smsTest = await SMSChannel.testConnection();
    
    return {
      email: emailTest,
      sms: smsTest
    };
  }
}
