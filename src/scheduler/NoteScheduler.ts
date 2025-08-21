import cron from 'node-cron';
import { FixedDateNotesModel } from '../models/FixedDateNotesModel';
import { DeliveryQueue } from '../delivery/queue/DeliveryQueue';

export class NoteScheduler {
  private static isRunning = false;
  private static tasks: cron.ScheduledTask[] = [];

  // Start the scheduler
  static start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    if (process.env.SCHEDULER_ENABLED === 'false') {
      console.log('⚠️ Scheduler is disabled via environment variable');
      return;
    }

    console.log('🚀 Starting Note Scheduler Service...');
    
    const timezone = process.env.SCHEDULER_TIMEZONE || 'UTC';
    console.log(`🌍 Using timezone: ${timezone}`);

    try {
      // Run daily at 9:00 AM
      const dailyTask = cron.schedule('0 9 * * *', async () => {
        console.log(`🕘 Starting daily note delivery process at ${new Date().toISOString()}...`);
        await this.processScheduledNotes();
      }, {
        scheduled: true,
        timezone: timezone
      });
      
      this.tasks.push(dailyTask);

      // For development/testing - run every 5 minutes (uncomment for testing)
      if (process.env.NODE_ENV === 'development' && process.env.SCHEDULER_DEV_MODE === 'true') {
        console.log('🧪 Development mode: Adding test scheduler (every 5 minutes)');
        const testTask = cron.schedule('*/5 * * * *', async () => {
          console.log('🧪 [DEV] Processing scheduled notes...');
          await this.processScheduledNotes();
        });
        this.tasks.push(testTask);
      }

      this.isRunning = true;
      console.log('✅ Note Scheduler started successfully');
      console.log(`📅 Next delivery check: Daily at 9:00 AM ${timezone}`);

    } catch (error) {
      console.error('❌ Error starting scheduler:', error);
      throw error;
    }
  }

  // Stop the scheduler
  static stop() {
    try {
      this.tasks.forEach(task => {
        if (task) {
          task.stop();
        }
      });
      this.tasks = [];
      this.isRunning = false;
      console.log('🛑 Note Scheduler stopped');
    } catch (error) {
      console.error('❌ Error stopping scheduler:', error);
    }
  }

  // Main function to process scheduled notes
  static async processScheduledNotes() {
    try {
      // Get all notes scheduled for delivery today
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const scheduledNotes = await FixedDateNotesModel.getNotesForDelivery(today);
      
      console.log(`📝 Found ${scheduledNotes.length} notes scheduled for delivery`);

      if (scheduledNotes.length === 0) {
        console.log('📭 No notes to deliver today');
        return;
      }

      // Get detailed notes with recipients
      const processedCount = await this.queueNotesForDelivery(scheduledNotes);
      
      console.log(`✅ Successfully queued ${processedCount} notes for delivery`);

    } catch (error) {
      console.error('❌ Error processing scheduled notes:', error);
    }
  }

  // Queue notes for delivery
  private static async queueNotesForDelivery(scheduledNotes: any[]): Promise<number> {
    let processedCount = 0;

    for (const scheduledNote of scheduledNotes) {
      try {
        // Get the note details with recipients
        const noteWithDetails = await FixedDateNotesModel.getFixedDateNotesWithNoteDetails( 
          scheduledNote.userId
        );

        if (!noteWithDetails) {
          console.warn(`⚠️ Note details not found for scheduled note ${scheduledNote.id}`);
          continue;
        }

        // Add to delivery queue
        await DeliveryQueue.addDeliveryJob({
          fixedDateNoteId: scheduledNote.id,
          noteId: scheduledNote.notesId,
          userId: scheduledNote.userId,
          deliveryDate: scheduledNote.deliveryDate,
          noteContent: noteWithDetails?.note?.note || '',
          attachment: noteWithDetails?.note?.attachment,
          recipients: noteWithDetails?.note?.recipientIds || []
        });

        // Update status to 'processing'
        await FixedDateNotesModel.updateFixedDateNote(
          scheduledNote.id,
          scheduledNote.userId,
          { status: 'processing' }
        );

        processedCount++;
        console.log(`📤 Queued note ${scheduledNote.notesId} for delivery`);

      } catch (error) {
        console.error(`❌ Error queuing note ${scheduledNote.id}:`, error);
        
        // Mark as failed
        try {
          await FixedDateNotesModel.updateFixedDateNote(
            scheduledNote.id,
            scheduledNote.userId,
            { status: 'failed' }
          );
        } catch (updateError) {
          console.error(`❌ Error updating status for note ${scheduledNote.id}:`, updateError);
        }
      }
    }

    return processedCount;
  }

  // Manual trigger for testing
  static async triggerNow() {
    console.log('🧪 Manually triggering note processing...');
    await this.processScheduledNotes();
  }

  // Get scheduler status
  static getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.length,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
      nextRun: this.isRunning ? 'Daily at 9:00 AM' : 'Not scheduled',
      devMode: process.env.NODE_ENV === 'development' && process.env.SCHEDULER_DEV_MODE === 'true'
    };
  }

  // Health check for monitoring
  static async healthCheck(): Promise<{ 
    scheduler: boolean; 
    queue: boolean; 
    database: boolean; 
    lastRun?: Date;
    errors?: string[] 
  }> {
    const errors: string[] = [];
    let databaseOk = false;
    let queueOk = false;

    // Check database connection
    try {
      await FixedDateNotesModel.getNotesForDelivery(new Date());
      databaseOk = true;
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check queue connection
    try {
      await DeliveryQueue.getStats();
      queueOk = true;
    } catch (error) {
      errors.push(`Queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      scheduler: this.isRunning,
      queue: queueOk,
      database: databaseOk,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
