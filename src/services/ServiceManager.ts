import { NoteScheduler } from '../scheduler/NoteScheduler';
import { DeliveryQueue } from '../delivery/queue/DeliveryQueue';
import { EmailChannel, SMSChannel } from '../delivery/channels';

export class ServiceManager {
  private static initialized = false;

  // Initialize all services
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ Services already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Dead Hand Services...');

      // Test delivery channels
      await this.testChannels();

      // Start delivery queue processor
      console.log('📥 Starting delivery queue...');
      DeliveryQueue.start();

      // Start note scheduler
      console.log('⏰ Starting note scheduler...');
      NoteScheduler.start();

      this.initialized = true;
      console.log('✅ All services initialized successfully');

      // Set up graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Error initializing services:', error);
      throw error;
    }
  }

  // Test all delivery channels
  private static async testChannels(): Promise<void> {
    console.log('🔍 Testing delivery channels...');

    try {
      // Test email channel
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const emailTest = await EmailChannel.testConnection();
        console.log(`📧 Email channel: ${emailTest ? '✅ Connected' : '❌ Failed'}`);
      } else {
        console.log('📧 Email channel: ⚠️ Not configured (development mode)');
      }

      // Test SMS channel
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const smsTest = await SMSChannel.testConnection();
        console.log(`📱 SMS channel: ${smsTest ? '✅ Connected' : '❌ Failed'}`);
      } else {
        console.log('📱 SMS channel: ⚠️ Not configured (development mode)');
      }

    } catch (error) {
      console.warn('⚠️ Channel testing failed:', error);
    }
  }

  // Shutdown all services gracefully
  static async shutdown(): Promise<void> {
    if (!this.initialized) {
      console.log('⚠️ Services not initialized, nothing to shutdown');
      return;
    }

    try {
      console.log('🛑 Shutting down services...');

      // Stop scheduler
      console.log('⏰ Stopping note scheduler...');
      NoteScheduler.stop();

      // Stop delivery queue
      console.log('📥 Stopping delivery queue...');
      await DeliveryQueue.stop();

      this.initialized = false;
      console.log('✅ All services shut down gracefully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  // Setup graceful shutdown handlers
  private static setupGracefulShutdown(): void {
    // Handle different exit signals
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR1', 'SIGUSR2'] as const;

    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
        await this.shutdown();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      await this.shutdown();
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  // Get status of all services
  static async getServicesStatus(): Promise<{
    initialized: boolean;
    scheduler: any;
    queue: any;
    health: any;
  }> {
    try {
      return {
        initialized: this.initialized,
        scheduler: NoteScheduler.getStatus(),
        queue: await DeliveryQueue.getStats(),
        health: await NoteScheduler.healthCheck()
      };
    } catch (error) {
      return {
        initialized: this.initialized,
        scheduler: { error: 'Failed to get scheduler status' },
        queue: { error: 'Failed to get queue status' },
        health: { error: 'Failed to get health status' }
      };
    }
  }

  // Manual trigger for testing
  static async triggerDeliveryCheck(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Services not initialized');
    }

    console.log('🧪 Manually triggering delivery check...');
    await NoteScheduler.triggerNow();
  }

  // Clean old jobs and data
  static async performMaintenance(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Services not initialized');
    }

    try {
      console.log('🧹 Performing maintenance...');
      
      // Clean old delivery jobs
      await DeliveryQueue.cleanOldJobs();
      
      console.log('✅ Maintenance completed');
    } catch (error) {
      console.error('❌ Maintenance failed:', error);
      throw error;
    }
  }

  // Check if services are initialized
  static isInitialized(): boolean {
    return this.initialized;
  }
}
