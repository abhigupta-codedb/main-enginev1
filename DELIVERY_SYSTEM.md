# Dead Hand Note Delivery System

This document describes the implementation of the scheduled note delivery system.

## Overview

The Dead Hand Note Delivery System allows users to schedule notes for future delivery to recipients via multiple communication channels (email, SMS). The system consists of several key components:

1. **Scheduler Service** - Processes scheduled notes daily
2. **Delivery Queue** - Manages delivery jobs with Redis/Bull
3. **Delivery Channels** - Handles actual message delivery (Email, SMS)
4. **Service Manager** - Coordinates all services

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Scheduler     │    │ Delivery Queue  │    │ Delivery        │
│   Service       │───▶│    (Redis)      │───▶│   Channels      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │  Email/SMS      │
         │                       │              │  Providers      │
         │                       │              └─────────────────┘
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Admin API     │
│   (PostgreSQL)  │    │   Endpoints     │
└─────────────────┘    └─────────────────┘
```

## Components

### 1. Scheduler Service (`src/scheduler/NoteScheduler.ts`)

The scheduler runs daily (9:00 AM) using node-cron and:

- Fetches notes scheduled for delivery
- Queues them in the delivery system
- Updates note status to 'processing'

**Configuration:**

```env
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=America/New_York
SCHEDULER_DEV_MODE=true  # Runs every 5 minutes in dev
```

### 2. Delivery Queue (`src/delivery/queue/DeliveryQueue.ts`)

Uses Bull queue with Redis for reliable job processing:

- Retry failed deliveries (3 attempts with exponential backoff)
- Process multiple jobs concurrently (5 workers)
- Automatic cleanup of old jobs

**Configuration:**

```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Delivery Channels

#### Email Channel (`src/delivery/channels/EmailChannel.ts`)

- Uses Nodemailer for SMTP delivery
- Supports HTML formatting with attachments
- Falls back to console logging in development

**Configuration:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@deadhand.com
```

#### SMS Channel (`src/delivery/channels/SMSChannel.ts`)

- Uses Twilio for SMS delivery
- Automatic phone number formatting
- Message truncation for long content

**Configuration:**

```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
SMS_DEV_MODE=true  # Console logging in dev
```

### 4. Service Manager (`src/services/ServiceManager.ts`)

Coordinates all services:

- Initializes scheduler and queue
- Tests channel connectivity
- Handles graceful shutdown
- Provides health checking

## API Endpoints

### Admin Endpoints (`/api/admin/`)

#### Get Service Status

```http
GET /api/admin/status
```

Response:

```json
{
  "success": true,
  "data": {
    "initialized": true,
    "scheduler": {
      "isRunning": true,
      "activeTasks": 1,
      "timezone": "America/New_York"
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
}
```

#### Health Check

```http
GET /api/admin/health
```

#### Manual Delivery Trigger (Testing)

```http
POST /api/admin/trigger-delivery
```

#### Maintenance

```http
POST /api/admin/maintenance
```

## Delivery Process

1. **Scheduling**: User creates a fixed date note via API
2. **Detection**: Scheduler runs daily and finds notes due for delivery
3. **Queueing**: Notes are added to delivery queue with retry logic
4. **Processing**: Queue workers pick up jobs and attempt delivery
5. **Channel Selection**: Primary email, fallback to SMS if available
6. **Status Updates**: Database updated with delivery status
7. **Completion**: Recipients receive notes via configured channels

## Error Handling

### Retry Logic

- Failed deliveries retry 3 times with exponential backoff
- Different failure reasons tracked separately
- Partial delivery success still marked as completed

### Fallback Channels

- Email is primary delivery method
- SMS used as fallback if email fails
- Future: Push notifications, social media DMs

### Monitoring

- Health check endpoint for service status
- Queue statistics for monitoring delivery load
- Error logging for troubleshooting

## Development Setup

1. **Install Dependencies** (already done):

   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure:

   ```env
   NODE_ENV=development

   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/deadhand_db

   # Email (Gmail example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # SMS (Twilio)
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=+1234567890

   # Redis
   REDIS_URL=redis://localhost:6379

   # Development mode
   SMS_DEV_MODE=true
   EMAIL_DEV_MODE=true
   SCHEDULER_DEV_MODE=true
   ```

3. **Start Redis** (if not using development mode):

   ```bash
   redis-server
   ```

4. **Run Application**:
   ```bash
   npm run dev
   ```

## Testing

### Manual Testing

1. Create a fixed date note with current date
2. Check admin status: `GET /api/admin/status`
3. Trigger delivery: `POST /api/admin/trigger-delivery`
4. Check logs for delivery attempts

### Development Mode

- Set `SCHEDULER_DEV_MODE=true` to run every 5 minutes
- Set `SMS_DEV_MODE=true` and `EMAIL_DEV_MODE=true` for console logging
- No actual emails/SMS sent in development mode

## Production Deployment

### Prerequisites

1. PostgreSQL database with schema applied
2. Redis server for queue management
3. SMTP credentials (Gmail, SendGrid, etc.)
4. Twilio account for SMS (optional)

### Environment Variables

All production environment variables should be set securely:

- Database connection string
- SMTP credentials
- Twilio credentials
- Redis connection details

### Monitoring

- Use `/api/admin/health` for health checks
- Monitor queue statistics via admin endpoints
- Set up log aggregation for error tracking

## Scaling Considerations

### Horizontal Scaling

- Multiple worker processes can share the same Redis queue
- Database connections should be pooled
- Load balancer for HTTP endpoints

### Queue Scaling

- Redis cluster for high availability
- Separate queues for different priority levels
- Queue monitoring and alerting

### Channel Scaling

- Rate limiting for external APIs (Twilio, SMTP)
- Circuit breakers for failing channels
- Channel-specific retry strategies

## Security

### Credentials

- All API keys stored in environment variables
- No credentials in code or logs
- Secure credential rotation procedures

### Content

- Note content sanitized before delivery
- Attachment scanning (future enhancement)
- Recipient validation

### Access Control

- Admin endpoints should be protected in production
- API authentication for note management
- Audit logging for delivery actions

## Future Enhancements

1. **Additional Channels**:

   - WhatsApp Business API
   - Push notifications
   - Social media DMs
   - Telegram

2. **Advanced Features**:

   - Delivery scheduling by timezone
   - Recipient preferences
   - Delivery confirmations
   - Read receipts

3. **Analytics**:

   - Delivery success rates
   - Channel performance metrics
   - User engagement statistics

4. **Enterprise Features**:
   - Multi-tenant support
   - Advanced templating
   - Workflow automation
   - API webhooks
