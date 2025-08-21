export interface IDeliveryChannel {
  send(data: any): Promise<void>;
}

export interface EmailData {
  to: string;
  recipientName: string;
  subject: string;
  content: string;
  attachment?: string;
}

export interface SMSData {
  to: string;
  recipientName: string;
  message: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}
