# Dead Hand Delivery System - Quick Start Guide

## 🚀 Overview

The Dead Hand Note Delivery System is now fully implemented with the following components:

- **Scheduler Service** - Runs daily to process scheduled notes
- **Delivery Queue** - Redis-based job queue for reliable delivery
- **Email Channel** - SMTP-based email delivery with HTML formatting
- **SMS Channel** - Twilio-based SMS delivery with fallback support
- **Service Manager** - Coordinates all services with graceful shutdown
- **Admin API** - Monitor and manage the delivery system

## 🛠️ Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

#### Required Settings:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/deadhand_db

# Basic App Settings
NODE_ENV=development
PORT=3000
```

#### Email Configuration (Gmail example):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use app password, not regular password
FROM_EMAIL=noreply@deadhand.com
```

#### SMS Configuration (Twilio):

```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Development Mode (recommended for testing):

```env
SMS_DEV_MODE=true
EMAIL_DEV_MODE=true
SCHEDULER_DEV_MODE=true  # Runs every 5 minutes instead of daily
```

### 2. Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Or build and start in production
npm run build
npm start
```

## 🧪 Testing the System

### Quick Tests

```bash
# Test delivery channels connectivity
npm run test:channels

# Check scheduled notes
npm run test:scheduled

# Test menu (shows all options)
npm run test:delivery
```

### Manual Testing

1. **Test Email Channel:**

   ```bash
   npx ts-node src/utils/testRunner.ts email your@email.com
   ```

2. **Test SMS Channel:**

   ```bash
   npx ts-node src/utils/testRunner.ts sms +1234567890
   ```

3. **Test Full Pipeline:**
   ```bash
   npx ts-node src/utils/testRunner.ts pipeline test-user your@email.com
   ```

### Using the Admin API

Once the server is running, you can monitor the system:

```bash
# Check service status
curl http://localhost:3000/api/admin/status

# Health check
curl http://localhost:3000/api/admin/health

# Manually trigger delivery (for testing)
curl -X POST http://localhost:3000/api/admin/trigger-delivery

# Perform maintenance
curl -X POST http://localhost:3000/api/admin/maintenance
```

## 📝 Creating and Scheduling Notes

### 1. Create a Note with Recipients

```bash
POST /api/users/{userId}/notes
Content-Type: application/json

{
  "note": "This is my scheduled message",
  "attachment": "Optional attachment content",
  "recipients": [
    {
      "recipientName": "John Doe",
      "recipientEmail": "john@example.com",
      "recipientContactNumber1": "+1234567890",
      "recipientRelationship": "Friend"
    }
  ]
}
```

### 2. Schedule the Note for Future Delivery

```bash
POST /api/users/{userId}/fixed-date-notes
Content-Type: application/json

{
  "notesId": 123,
  "deliveryDate": "2025-12-25T09:00:00Z"
}
```

## 🔄 How Delivery Works

1. **Scheduling**: User creates notes and schedules them for future delivery
2. **Detection**: Scheduler runs daily (9 AM) and finds notes due for delivery
3. **Queueing**: Notes are added to Redis queue with retry logic
4. **Processing**: Queue workers process delivery jobs
5. **Channel Selection**:
   - Primary: Email (if recipient has email)
   - Fallback: SMS (if email fails and phone available)
6. **Status Updates**: Database updated with delivery results

## 📊 Monitoring

### Service Status

Visit `http://localhost:3000/api/admin/status` to see:

```json
{
  "initialized": true,
  "scheduler": {
    "isRunning": true,
    "activeTasks": 1,
    "timezone": "UTC"
  },
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 45,
    "failed": 2
  },
  "health": {
    "scheduler": true,
    "queue": true,
    "database": true
  }
}
```

### Health Check

Use `http://localhost:3000/api/admin/health` for monitoring systems.

## 🚨 Development Mode

When developing, set these environment variables for easier testing:

```env
NODE_ENV=development
SCHEDULER_DEV_MODE=true     # Runs every 5 minutes
EMAIL_DEV_MODE=true         # Logs emails to console instead of sending
SMS_DEV_MODE=true          # Logs SMS to console instead of sending
LOG_LEVEL=DEBUG            # More detailed logging
```

In development mode:

- Emails/SMS are logged to console instead of actually sent
- Scheduler runs every 5 minutes instead of daily
- More detailed logging is available
- No real API credentials needed for testing

## 🔧 Production Configuration

For production deployment:

1. **Use real credentials** (remove dev mode flags)
2. **Set up Redis** for queue persistence
3. **Configure proper SMTP** (Gmail, SendGrid, etc.)
4. **Set up Twilio** for SMS delivery
5. **Use environment variables** for all secrets
6. **Set up monitoring** using the health check endpoints

### Production Environment Variables:

```env
NODE_ENV=production
LOG_LEVEL=INFO
LOG_STRUCTURED=true

# Remove dev mode flags
# SMS_DEV_MODE=false  (or don't set)
# EMAIL_DEV_MODE=false
# SCHEDULER_DEV_MODE=false

# Real Redis instance
REDIS_URL=redis://your-redis-server:6379

# Real SMTP credentials
SMTP_USER=your-production-email
SMTP_PASS=your-production-password

# Real Twilio credentials
TWILIO_ACCOUNT_SID=your-production-sid
TWILIO_AUTH_TOKEN=your-production-token
```

## 🐛 Troubleshooting

### Common Issues

1. **Emails not sending:**

   - Check SMTP credentials
   - Verify Gmail app password (not regular password)
   - Check firewall/network connectivity

2. **SMS not sending:**

   - Verify Twilio credentials
   - Check phone number format (+1234567890)
   - Ensure Twilio account has sufficient balance

3. **Scheduler not running:**

   - Check `SCHEDULER_ENABLED=true`
   - Verify timezone settings
   - Check logs for cron errors

4. **Queue issues:**
   - Ensure Redis is running
   - Check Redis connection settings
   - Monitor queue statistics via admin API

### Logs and Debugging

- Set `LOG_LEVEL=DEBUG` for detailed logging
- Check console output for service status
- Use admin endpoints to monitor system health
- Review delivery job status in logs

## 📖 Additional Documentation

- **Complete System Documentation**: See `DELIVERY_SYSTEM.md`
- **Database Schema**: See `DATABASE_SETUP.md`
- **API Endpoints**: Full documentation in both files above

## 🎯 Next Steps

1. **Test the basic functionality** using the test scripts
2. **Configure your email/SMS providers** for real delivery
3. **Create some test notes** and schedule them for delivery
4. **Monitor the system** using the admin endpoints
5. **Set up production deployment** when ready

The system is now ready for testing and development! 🚀
