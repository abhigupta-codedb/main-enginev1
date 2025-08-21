/**
 * Enhanced logging utility for the Dead Hand delivery system
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  service?: string;
  userId?: string;
  noteId?: number;
  deliveryId?: string;
  channel?: string;
  recipient?: string;
  jobId?: string;
  [key: string]: any;
}

export class DeliveryLogger {
  private static logLevel: LogLevel = LogLevel.INFO;
  
  // Set log level based on environment
  static {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': this.logLevel = LogLevel.ERROR; break;
      case 'WARN': this.logLevel = LogLevel.WARN; break;
      case 'INFO': this.logLevel = LogLevel.INFO; break;
      case 'DEBUG': this.logLevel = LogLevel.DEBUG; break;
      case 'TRACE': this.logLevel = LogLevel.TRACE; break;
      default: 
        this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  // Core logging method
  private static log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level > this.logLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...context,
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    // In development, use console with emojis for better readability
    if (process.env.NODE_ENV === 'development') {
      const emoji = this.getEmoji(level, context?.service);
      const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(`${emoji} ${message}${contextStr}`, error || '');
          break;
        case LogLevel.WARN:
          console.warn(`${emoji} ${message}${contextStr}`);
          break;
        default:
          console.log(`${emoji} ${message}${contextStr}`);
      }
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  // Get appropriate emoji for log level and service
  private static getEmoji(level: LogLevel, service?: string): string {
    if (service) {
      switch (service) {
        case 'scheduler': return '⏰';
        case 'queue': return '📥';
        case 'email': return '📧';
        case 'sms': return '📱';
        case 'delivery': return '🚀';
        case 'database': return '🗄️';
        default: break;
      }
    }

    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return '✅';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.TRACE: return '🔬';
      default: return '📝';
    }
  }

  // Public logging methods
  static error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  static warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  static info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  static debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  static trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Service-specific loggers
  static scheduler = {
    info: (message: string, context?: LogContext) => 
      DeliveryLogger.info(message, { ...context, service: 'scheduler' }),
    warn: (message: string, context?: LogContext) => 
      DeliveryLogger.warn(message, { ...context, service: 'scheduler' }),
    error: (message: string, context?: LogContext, error?: Error) => 
      DeliveryLogger.error(message, { ...context, service: 'scheduler' }, error),
    debug: (message: string, context?: LogContext) => 
      DeliveryLogger.debug(message, { ...context, service: 'scheduler' })
  };

  static queue = {
    info: (message: string, context?: LogContext) => 
      DeliveryLogger.info(message, { ...context, service: 'queue' }),
    warn: (message: string, context?: LogContext) => 
      DeliveryLogger.warn(message, { ...context, service: 'queue' }),
    error: (message: string, context?: LogContext, error?: Error) => 
      DeliveryLogger.error(message, { ...context, service: 'queue' }, error),
    debug: (message: string, context?: LogContext) => 
      DeliveryLogger.debug(message, { ...context, service: 'queue' })
  };

  static email = {
    info: (message: string, context?: LogContext) => 
      DeliveryLogger.info(message, { ...context, service: 'email' }),
    warn: (message: string, context?: LogContext) => 
      DeliveryLogger.warn(message, { ...context, service: 'email' }),
    error: (message: string, context?: LogContext, error?: Error) => 
      DeliveryLogger.error(message, { ...context, service: 'email' }, error),
    debug: (message: string, context?: LogContext) => 
      DeliveryLogger.debug(message, { ...context, service: 'email' })
  };

  static sms = {
    info: (message: string, context?: LogContext) => 
      DeliveryLogger.info(message, { ...context, service: 'sms' }),
    warn: (message: string, context?: LogContext) => 
      DeliveryLogger.warn(message, { ...context, service: 'sms' }),
    error: (message: string, context?: LogContext, error?: Error) => 
      DeliveryLogger.error(message, { ...context, service: 'sms' }, error),
    debug: (message: string, context?: LogContext) => 
      DeliveryLogger.debug(message, { ...context, service: 'sms' })
  };

  static delivery = {
    info: (message: string, context?: LogContext) => 
      DeliveryLogger.info(message, { ...context, service: 'delivery' }),
    warn: (message: string, context?: LogContext) => 
      DeliveryLogger.warn(message, { ...context, service: 'delivery' }),
    error: (message: string, context?: LogContext, error?: Error) => 
      DeliveryLogger.error(message, { ...context, service: 'delivery' }, error),
    debug: (message: string, context?: LogContext) => 
      DeliveryLogger.debug(message, { ...context, service: 'delivery' })
  };

  // Performance logging
  static timeStart(operation: string, context?: LogContext): string {
    const timerId = `${operation}-${Date.now()}`;
    this.debug(`Starting ${operation}`, { ...context, timerId, operation });
    return timerId;
  }

  static timeEnd(timerId: string, operation: string, context?: LogContext): void {
    const duration = Date.now() - parseInt(timerId.split('-').pop() || '0');
    this.debug(`Completed ${operation}`, { ...context, timerId, operation, duration: `${duration}ms` });
  }

  // Delivery event logging
  static deliveryStarted(noteId: number, recipients: number, context?: LogContext): void {
    this.delivery.info('Delivery started', { 
      ...context, 
      noteId, 
      recipientCount: recipients,
      event: 'delivery_started'
    });
  }

  static deliveryCompleted(noteId: number, successful: number, failed: number, context?: LogContext): void {
    this.delivery.info('Delivery completed', { 
      ...context, 
      noteId, 
      successful, 
      failed,
      event: 'delivery_completed'
    });
  }

  static deliveryFailed(noteId: number, error: Error, context?: LogContext): void {
    this.delivery.error('Delivery failed', { 
      ...context, 
      noteId,
      event: 'delivery_failed'
    }, error);
  }

  static recipientDelivered(noteId: number, recipient: string, channel: string, context?: LogContext): void {
    this.delivery.info('Recipient delivery successful', { 
      ...context, 
      noteId, 
      recipient, 
      channel,
      event: 'recipient_delivered'
    });
  }

  static recipientFailed(noteId: number, recipient: string, channel: string, error: string, context?: LogContext): void {
    this.delivery.error('Recipient delivery failed', { 
      ...context, 
      noteId, 
      recipient, 
      channel,
      error: error,
      event: 'recipient_failed'
    });
  }
}
