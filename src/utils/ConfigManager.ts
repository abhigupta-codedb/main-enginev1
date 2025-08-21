/**
 * Configuration management for the Dead Hand delivery system
 * Centralizes all configuration with validation and defaults
 */

export interface DeliveryConfig {
  // Database
  database: {
    url: string;
  };

  // Scheduler
  scheduler: {
    enabled: boolean;
    timezone: string;
    dailyTime: string; // "09:00"
    devMode: boolean;
    devInterval: string; // "*/5 * * * *"
  };

  // Queue
  queue: {
    redis: {
      url?: string;
      host: string;
      port: number;
      connectTimeout: number;
      commandTimeout: number;
    };
    concurrency: number;
    maxRetries: number;
    retryDelay: number;
    cleanupIntervals: {
      completed: number; // milliseconds
      failed: number;
    };
  };

  // Email
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    };
    from: string;
    devMode: boolean;
  };

  // SMS
  sms: {
    enabled: boolean;
    twilio: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
    devMode: boolean;
  };

  // Logging
  logging: {
    level: string;
    structured: boolean;
  };

  // General
  app: {
    environment: string;
    port: number;
  };
}

export class ConfigManager {
  private static config: DeliveryConfig;

  // Load and validate configuration
  static load(): DeliveryConfig {
    if (this.config) {
      return this.config;
    }

    this.config = {
      database: {
        url: this.getRequired('DATABASE_URL')
      },

      scheduler: {
        enabled: this.getBool('SCHEDULER_ENABLED', true),
        timezone: this.get('SCHEDULER_TIMEZONE', 'UTC'),
        dailyTime: this.get('SCHEDULER_DAILY_TIME', '09:00'),
        devMode: this.getBool('SCHEDULER_DEV_MODE', false),
        devInterval: this.get('SCHEDULER_DEV_INTERVAL', '*/5 * * * *')
      },

      queue: {
        redis: {
          url: this.get('REDIS_URL'),
          host: this.get('REDIS_HOST', 'localhost'),
          port: this.getInt('REDIS_PORT', 6379),
          connectTimeout: this.getInt('REDIS_CONNECT_TIMEOUT', 60000),
          commandTimeout: this.getInt('REDIS_COMMAND_TIMEOUT', 5000)
        },
        concurrency: this.getInt('QUEUE_CONCURRENCY', 5),
        maxRetries: this.getInt('QUEUE_MAX_RETRIES', 3),
        retryDelay: this.getInt('QUEUE_RETRY_DELAY', 30000),
        cleanupIntervals: {
          completed: this.getInt('QUEUE_CLEANUP_COMPLETED', 24 * 60 * 60 * 1000), // 1 day
          failed: this.getInt('QUEUE_CLEANUP_FAILED', 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },

      email: {
        enabled: this.hasEmailConfig(),
        smtp: {
          host: this.get('SMTP_HOST', 'smtp.gmail.com'),
          port: this.getInt('SMTP_PORT', 587),
          secure: this.getBool('SMTP_SECURE', false),
          user: this.get('SMTP_USER', ''),
          pass: this.get('SMTP_PASS', '')
        },
        from: this.get('FROM_EMAIL', 'noreply@deadhand.com'),
        devMode: this.getBool('EMAIL_DEV_MODE', !this.hasEmailConfig())
      },

      sms: {
        enabled: this.hasSMSConfig(),
        twilio: {
          accountSid: this.get('TWILIO_ACCOUNT_SID', ''),
          authToken: this.get('TWILIO_AUTH_TOKEN', ''),
          fromNumber: this.get('TWILIO_PHONE_NUMBER', '')
        },
        devMode: this.getBool('SMS_DEV_MODE', !this.hasSMSConfig())
      },

      logging: {
        level: this.get('LOG_LEVEL', process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO'),
        structured: this.getBool('LOG_STRUCTURED', process.env.NODE_ENV === 'production')
      },

      app: {
        environment: this.get('NODE_ENV', 'development'),
        port: this.getInt('PORT', 3000)
      }
    };

    this.validateConfig();
    return this.config;
  }

  // Get current configuration
  static getConfig(): DeliveryConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  // Environment variable helpers
  private static get(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  private static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private static getInt(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid integer, got: ${value}`);
    }
    return parsed;
  }

  private static getBool(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  // Check if email configuration is available
  private static hasEmailConfig(): boolean {
    return !!(this.get('SMTP_USER') && this.get('SMTP_PASS'));
  }

  // Check if SMS configuration is available
  private static hasSMSConfig(): boolean {
    return !!(this.get('TWILIO_ACCOUNT_SID') && this.get('TWILIO_AUTH_TOKEN'));
  }

  // Validate configuration
  private static validateConfig(): void {
    const errors: string[] = [];

    // Validate database
    if (!this.config.database.url) {
      errors.push('DATABASE_URL is required');
    }

    // Validate Redis configuration
    if (this.config.queue.redis.port < 1 || this.config.queue.redis.port > 65535) {
      errors.push('REDIS_PORT must be between 1 and 65535');
    }

    // Validate email configuration if enabled
    if (this.config.email.enabled) {
      if (!this.config.email.smtp.user || !this.config.email.smtp.pass) {
        errors.push('SMTP_USER and SMTP_PASS are required when email is enabled');
      }
      if (this.config.email.smtp.port < 1 || this.config.email.smtp.port > 65535) {
        errors.push('SMTP_PORT must be between 1 and 65535');
      }
    }

    // Validate SMS configuration if enabled
    if (this.config.sms.enabled) {
      if (!this.config.sms.twilio.accountSid || !this.config.sms.twilio.authToken) {
        errors.push('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required when SMS is enabled');
      }
      if (!this.config.sms.twilio.fromNumber) {
        errors.push('TWILIO_PHONE_NUMBER is required when SMS is enabled');
      }
    }

    // Validate scheduler time format
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(this.config.scheduler.dailyTime)) {
      errors.push('SCHEDULER_DAILY_TIME must be in HH:MM format (e.g., 09:00)');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  // Get configuration summary for logging
  static getConfigSummary(): object {
    const config = this.getConfig();
    return {
      environment: config.app.environment,
      scheduler: {
        enabled: config.scheduler.enabled,
        timezone: config.scheduler.timezone,
        devMode: config.scheduler.devMode
      },
      channels: {
        email: config.email.enabled ? 'enabled' : (config.email.devMode ? 'dev-mode' : 'disabled'),
        sms: config.sms.enabled ? 'enabled' : (config.sms.devMode ? 'dev-mode' : 'disabled')
      },
      queue: {
        redis: config.queue.redis.url ? 'external' : 'localhost',
        concurrency: config.queue.concurrency
      },
      logging: {
        level: config.logging.level,
        structured: config.logging.structured
      }
    };
  }

  // Check if running in development mode
  static isDevelopment(): boolean {
    return this.getConfig().app.environment === 'development';
  }

  // Check if running in production mode
  static isProduction(): boolean {
    return this.getConfig().app.environment === 'production';
  }

  // Get cron pattern for scheduler
  static getSchedulerCronPattern(): string {
    const config = this.getConfig();
    
    if (config.scheduler.devMode && this.isDevelopment()) {
      return config.scheduler.devInterval;
    }

    // Parse daily time (e.g., "09:00" -> "0 9 * * *")
    const [hours, minutes] = config.scheduler.dailyTime.split(':');
    return `${minutes} ${hours} * * *`;
  }
}
