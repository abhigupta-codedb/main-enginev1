import Queue from 'bull';
import { DeliveryProcessor } from '../DeliveryProcessor';

// Interface for delivery job data
export interface DeliveryJobData {
  fixedDateNoteId: number;
  noteId: number;
  userId: string;
  deliveryDate: Date;
  noteContent: string;
  attachment?: string;
  recipients: Array<{
    id: number;
    recipientName: string;
    recipientEmail: string;
    recipientContactNumber1?: string;
    recipientContactNumber2?: string;
    recipientRelationship?: string;
    recipientInstagram?: string;
    recipientLinkedin?: string;
    recipientTwitter?: string;
    recipientFacebook?: string;
  }>;
}

// Create queue with Redis configuration
function createQueue(): Queue.Queue {
  const redisConfig = {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    // Add timeout settings
    connectTimeout: 60000,
    commandTimeout: 5000,
  };

  // Try to use Redis URL if provided
  if (process.env.REDIS_URL) {
    return new Queue('note delivery', process.env.REDIS_URL);
  }

  // Use individual Redis settings
  return new Queue('note delivery', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 20,
    }
  });
}

// Initialize the queue
export const deliveryQueue = createQueue();

export class DeliveryQueue {
  private static isStarted = false;

  // Add a delivery job to the queue
  static async addDeliveryJob(jobData: DeliveryJobData): Promise<void> {
    try {
      await deliveryQueue.add('deliver-note', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds
        },
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 20,     // Keep last 20 failed jobs
      });

      console.log(`📥 Added delivery job for note ${jobData.noteId} to queue`);
    } catch (error) {
      console.error('❌ Error adding job to delivery queue:', error);
      throw error;
    }
  }

  // Start processing the delivery queue
  static start(): void {
    if (this.isStarted) {
      console.log('⚠️ Delivery queue is already started');
      return;
    }

    console.log('🚀 Starting Delivery Queue Processor...');

    // Process delivery jobs
    deliveryQueue.process('deliver-note', 5, DeliveryProcessor.processDelivery); // Process up to 5 jobs concurrently

    // Handle successful job completion
    deliveryQueue.on('completed', async (job) => {
      console.log(`✅ Delivery completed for note ${job.data.noteId}`);
      
      try {
        const { FixedDateNotesModel } = await import('../../models/FixedDateNotesModel');
        await FixedDateNotesModel.updateFixedDateNote(
          job.data.fixedDateNoteId,
          job.data.userId,
          { 
            status: 'delivered',
            deletionDate: new Date() // Mark for future cleanup
          }
        );
      } catch (error) {
        console.error(`❌ Error updating delivery status for note ${job.data.noteId}:`, error);
      }
    });

    // Handle job failure
    deliveryQueue.on('failed', async (job, err) => {
      console.error(`❌ Delivery failed for note ${job.data.noteId}:`, err.message);
      
      try {
        const { FixedDateNotesModel } = await import('../../models/FixedDateNotesModel');
        await FixedDateNotesModel.updateFixedDateNote(
          job.data.fixedDateNoteId,
          job.data.userId,
          { status: 'failed' }
        );
      } catch (error) {
        console.error(`❌ Error updating failure status for note ${job.data.noteId}:`, error);
      }
    });

    // Handle job progress (optional)
    deliveryQueue.on('progress', (job, progress) => {
      console.log(`🔄 Delivery progress for note ${job.data.noteId}: ${progress}%`);
    });

    this.isStarted = true;
    console.log('✅ Delivery Queue Processor started successfully');
  }

  // Stop the delivery queue
  static async stop(): Promise<void> {
    try {
      await deliveryQueue.close();
      this.isStarted = false;
      console.log('🛑 Delivery Queue stopped');
    } catch (error) {
      console.error('❌ Error stopping delivery queue:', error);
    }
  }

  // Get queue statistics
  static async getStats() {
    try {
      const waiting = await deliveryQueue.getWaiting();
      const active = await deliveryQueue.getActive();
      const completed = await deliveryQueue.getCompleted();
      const failed = await deliveryQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        isStarted: this.isStarted
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        isStarted: this.isStarted,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clean old jobs (maintenance)
  static async cleanOldJobs(): Promise<void> {
    try {
      await deliveryQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 1 day
      await deliveryQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
      console.log('🧹 Cleaned old jobs from delivery queue');
    } catch (error) {
      console.error('❌ Error cleaning old jobs:', error);
    }
  }
}
