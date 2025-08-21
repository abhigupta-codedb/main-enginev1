import { Job } from 'bull';
import { DeliveryJobData } from './queue/DeliveryQueue';
import { EmailChannel } from './channels/EmailChannel';
import { SMSChannel } from './channels/SMSChannel';

export class DeliveryProcessor {
  
  // Main function to process delivery jobs
  static async processDelivery(job: Job<DeliveryJobData>): Promise<void> {
    const { noteContent, attachment, recipients, noteId, userId } = job.data;
    
    console.log(`🚀 Processing delivery for note ${noteId} to ${recipients.length} recipients`);
    
    if (recipients.length === 0) {
      console.warn(`⚠️ No recipients found for note ${noteId}`);
      return;
    }

    let deliveredCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each recipient
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Update job progress
      const progress = Math.round(((i + 1) / recipients.length) * 100);
      job.progress(progress);

      try {
        console.log(`📧 Delivering to ${recipient.recipientName} (${recipient.recipientEmail})`);
        
        // Attempt delivery through available channels
        const deliveryResult = await this.deliverToRecipient(recipient, noteContent, attachment);
        
        if (deliveryResult.success) {
          deliveredCount++;
          console.log(`✅ Successfully delivered to ${recipient.recipientName} via ${deliveryResult.channels.join(', ')}`);
        } else {
          failedCount++;
          errors.push(`Failed to deliver to ${recipient.recipientName}: ${deliveryResult.error}`);
          console.error(`❌ Failed to deliver to ${recipient.recipientName}: ${deliveryResult.error}`);
        }

      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error delivering to ${recipient.recipientName}: ${errorMessage}`);
        console.error(`❌ Error delivering to ${recipient.recipientName}:`, error);
      }

      // Small delay between deliveries to avoid rate limiting
      if (i < recipients.length - 1) {
        await this.delay(1000); // 1 second delay
      }
    }

    // Summary
    console.log(`📊 Delivery Summary for note ${noteId}:`);
    console.log(`   ✅ Delivered: ${deliveredCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join('; ')}`);
    }

    // If any deliveries failed, throw an error to mark the job as failed
    if (failedCount > 0 && deliveredCount === 0) {
      throw new Error(`All deliveries failed. Errors: ${errors.join('; ')}`);
    } else if (failedCount > 0) {
      console.warn(`⚠️ Partial delivery success for note ${noteId}: ${deliveredCount}/${recipients.length} delivered`);
    }
  }

  // Deliver to a single recipient through available channels
  private static async deliverToRecipient(
    recipient: any, 
    noteContent: string, 
    attachment?: string
  ): Promise<{ success: boolean; channels: string[]; error?: string }> {
    const deliveredChannels: string[] = [];
    let lastError: string | undefined;

    // Primary: Email delivery
    if (recipient.recipientEmail) {
      try {
        await EmailChannel.send({
          to: recipient.recipientEmail,
          recipientName: recipient.recipientName,
          subject: 'You have a scheduled note',
          content: noteContent,
          attachment: attachment
        });
        deliveredChannels.push('email');
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Email delivery failed';
        console.error(`📧❌ Email delivery failed for ${recipient.recipientEmail}:`, error);
      }
    }

    // Secondary: SMS delivery (if email failed and phone available)
    if (deliveredChannels.length === 0 && recipient.recipientContactNumber1) {
      try {
        const smsContent = noteContent.length > 140 
          ? `${noteContent.substring(0, 137)}...` 
          : noteContent;
          
        await SMSChannel.send({
          to: recipient.recipientContactNumber1,
          recipientName: recipient.recipientName,
          message: `Scheduled Note: ${smsContent}`
        });
        deliveredChannels.push('sms');
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'SMS delivery failed';
        console.error(`📱❌ SMS delivery failed for ${recipient.recipientContactNumber1}:`, error);
      }
    }

    // Future: Add more channels (WhatsApp, Push Notifications, etc.)
    // if (deliveredChannels.length === 0 && recipient.recipientInstagram) {
    //   // Instagram DM delivery
    // }

    return {
      success: deliveredChannels.length > 0,
      channels: deliveredChannels,
      error: deliveredChannels.length === 0 ? lastError : undefined
    };
  }

  // Utility function for delays
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate delivery data before processing
  private static validateDeliveryData(data: DeliveryJobData): boolean {
    if (!data.noteContent || data.noteContent.trim().length === 0) {
      throw new Error('Note content is required');
    }

    if (!data.recipients || data.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    for (const recipient of data.recipients) {
      if (!recipient.recipientEmail && !recipient.recipientContactNumber1) {
        throw new Error(`Recipient ${recipient.recipientName} has no valid contact information`);
      }
    }

    return true;
  }
}
