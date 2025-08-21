import { ServiceManager } from '../services/ServiceManager';
import { FixedDateNotesModel } from '../models/FixedDateNotesModel';
import { NotesModel } from '../models/NotesModel';

/**
 * Test script for the delivery system
 * Run this to test note creation and delivery without waiting for the scheduler
 */
export class DeliveryTestScript {
  
  // Create a test note and schedule it for immediate delivery
  static async createTestNote(userId: string, testRecipientEmail: string): Promise<number> {
    try {
      console.log('🧪 Creating test note for immediate delivery...');
      
      // Create a regular note first
      const noteData = {
        userId: userId,
        note: 'This is a test note for the delivery system. If you receive this, the system is working correctly!',
        attachment: 'Test attachment content',
        recipientIds: [] // We'll add recipients separately
      };

      const note = await NotesModel.addNote(noteData);
      console.log(`📝 Created note with ID: ${note.id}`);

      // Schedule it for immediate delivery (today)
      const deliveryDate = new Date();
      const fixedDateNote = await FixedDateNotesModel.createFixedDateNote({
        notesId: note.id,
        userId: userId,
        deliveryDate: deliveryDate,
        status: 'scheduled'
      });

      console.log(`📅 Scheduled note for delivery: ${fixedDateNote.id}`);
      console.log(`📧 Recipient: ${testRecipientEmail}`);
      
      return fixedDateNote.id;

    } catch (error) {
      console.error('❌ Error creating test note:', error);
      throw error;
    }
  }

  // Test the entire delivery pipeline
  static async testDeliveryPipeline(userId: string, testRecipientEmail: string): Promise<void> {
    try {
      console.log('🚀 Testing complete delivery pipeline...');

      // Ensure services are initialized
      if (!ServiceManager.isInitialized()) {
        console.log('🔧 Initializing services...');
        await ServiceManager.initialize();
      }

      // Create test note
      const fixedDateNote = await this.createTestNote(userId, testRecipientEmail);

      // Wait a moment for the note to be created
      await this.delay(2000);

      // Manually trigger delivery process
      console.log('🎯 Triggering delivery process...');
      await ServiceManager.triggerDeliveryCheck();

      // Check status
      console.log('📊 Checking service status...');
      const status = await ServiceManager.getServicesStatus();
      console.log('Service Status:', JSON.stringify(status, null, 2));

      console.log('✅ Test completed! Check logs for delivery results.');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  // Test individual channels
  static async testChannels(): Promise<{ email: boolean; sms: boolean }> {
    try {
      console.log('🔍 Testing delivery channels...');

      const { EmailChannel, SMSChannel } = await import('../delivery/channels');

      // Test email
      console.log('📧 Testing email channel...');
      const emailTest = await EmailChannel.testConnection();
      console.log(`Email channel: ${emailTest ? '✅ Connected' : '❌ Failed'}`);

      // Test SMS
      console.log('📱 Testing SMS channel...');
      const smsTest = await SMSChannel.testConnection();
      console.log(`SMS channel: ${smsTest ? '✅ Connected' : '❌ Failed'}`);

      return { email: emailTest, sms: smsTest };

    } catch (error) {
      console.error('❌ Channel test failed:', error);
      throw error;
    }
  }

  // Send a test email directly
  static async sendTestEmail(recipientEmail: string): Promise<void> {
    try {
      console.log(`📧 Sending test email to ${recipientEmail}...`);

      const { EmailChannel } = await import('../delivery/channels');
      
      const result = await EmailChannel.send({
        to: recipientEmail,
        recipientName: 'Test User',
        subject: 'Test Email from Dead Hand System',
        content: 'This is a test email to verify the email delivery system is working correctly.',
        attachment: 'Test attachment content'
      });

      if (result.success) {
        console.log(`✅ Test email sent successfully! Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Test email failed: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ Error sending test email:', error);
      throw error;
    }
  }

  // Send a test SMS directly
  static async sendTestSMS(phoneNumber: string): Promise<void> {
    try {
      console.log(`📱 Sending test SMS to ${phoneNumber}...`);

      const { SMSChannel } = await import('../delivery/channels');
      
      const result = await SMSChannel.send({
        to: phoneNumber,
        recipientName: 'Test User',
        message: 'This is a test SMS from the Dead Hand delivery system. If you receive this, SMS delivery is working!'
      });

      if (result.success) {
        console.log(`✅ Test SMS sent successfully! Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Test SMS failed: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ Error sending test SMS:', error);
      throw error;
    }
  }

  // Check scheduled notes
  static async checkScheduledNotes(): Promise<void> {
    try {
      console.log('📅 Checking scheduled notes...');

      const today = new Date();
      const scheduledNotes = await FixedDateNotesModel.getNotesForDelivery(today);

      console.log(`Found ${scheduledNotes.length} notes scheduled for delivery:`);
      
      scheduledNotes.forEach((note, index) => {
        console.log(`${index + 1}. Note ID: ${note.notesId}, Delivery: ${note.deliveryDate}, Status: ${note.status}`);
      });

      if (scheduledNotes.length === 0) {
        console.log('💡 Tip: Create a note with today\'s date to test delivery');
      }

    } catch (error) {
      console.error('❌ Error checking scheduled notes:', error);
      throw error;
    }
  }

  // Utility function for delays
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Interactive test menu
  static async runInteractiveTest(): Promise<void> {
    console.log(`
🧪 Dead Hand Delivery System Test Menu
=====================================

Available tests:
1. Test delivery channels connectivity
2. Send test email
3. Send test SMS  
4. Check scheduled notes
5. Create test note and trigger delivery
6. Check service status

Choose a test to run or check the individual methods above.
    `);
  }
}

// Export for easy CLI usage
export default DeliveryTestScript;
