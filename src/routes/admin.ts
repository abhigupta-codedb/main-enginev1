import { Router } from 'express';
import { ServiceManager } from '../services/ServiceManager';

const router = Router();

// Get service status
router.get('/status', async (req, res) => {
  try {
    const status = await ServiceManager.getServicesStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual trigger delivery check (for testing)
router.post('/trigger-delivery', async (req, res) => {
  try {
    if (!ServiceManager.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    await ServiceManager.triggerDeliveryCheck();
    
    res.json({
      success: true,
      message: 'Delivery check triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger delivery check',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Perform maintenance
router.post('/maintenance', async (req, res) => {
  try {
    if (!ServiceManager.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    await ServiceManager.performMaintenance();
    
    res.json({
      success: true,
      message: 'Maintenance completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform maintenance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const status = await ServiceManager.getServicesStatus();
    const isHealthy = status.initialized && 
                     status.scheduler.isRunning && 
                     (!status.health.errors || status.health.errors.length === 0);

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      healthy: isHealthy,
      services: {
        scheduler: status.scheduler.isRunning,
        queue: status.queue.isStarted !== false,
        database: status.health.database,
      },
      errors: status.health.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      healthy: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
