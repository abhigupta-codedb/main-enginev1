# PostgreSQL Database Setup Guide

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres`

## Database Setup

### Option 1: Using psql Command Line

1. **Connect to PostgreSQL:**

```bash
psql -U postgres -h localhost
```

2. **Create Database:**

```sql
CREATE DATABASE main_enginev1;
CREATE USER main_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE main_enginev1 TO main_user;
```

3. **Connect to your database:**

```bash
psql -U main_user -d main_enginev1 -h localhost
```

4. **Run the schema:**

```bash
psql -U main_user -d main_enginev1 -h localhost -f database/schema.sql
```

### Option 2: Using Docker

1. **Start PostgreSQL with Docker:**

```bash
docker run --name main-engine-postgres \
  -e POSTGRES_DB=main_enginev1 \
  -e POSTGRES_USER=main_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15
```

2. **Run schema setup:**

```bash
docker exec -i main-engine-postgres psql -U main_user -d main_enginev1 < database/schema.sql
```

### Option 3: Using pgAdmin

1. Install pgAdmin: https://www.pgadmin.org/
2. Create a new server connection
3. Create database `main_enginev1`
4. Run the SQL from `database/schema.sql`

## Environment Variables

Update your `.env` file with your database credentials:

```bash
# Database Configuration
DATABASE_URL=postgresql://main_user:your_password@localhost:5432/main_enginev1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=main_enginev1
DB_USER=main_user
DB_PASSWORD=your_password
```

## Verify Setup

1. Start your server: `npm run dev`
2. Check the console for: `✅ Connected to PostgreSQL database`
3. Visit: `http://localhost:3000/login`
4. Sign in with Google
5. Check `http://localhost:3000/api/users` to see your user stored in PostgreSQL

## Database Schema

The application creates these tables:

- **users**: Stores Google OAuth user data
- **session**: Stores Express sessions

### Users Table Structure:

```sql
id VARCHAR(255) PRIMARY KEY,      -- Google User ID
email VARCHAR(255) UNIQUE,        -- User email from Google
name VARCHAR(255),                -- Display name from Google
picture TEXT,                     -- Profile picture URL
provider VARCHAR(50),             -- 'google'
created_at TIMESTAMP,             -- Account creation time
updated_at TIMESTAMP,             -- Last profile update
last_login TIMESTAMP              -- Last login time
```

## Useful PostgreSQL Commands

```sql
-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- View recent logins
SELECT name, email, last_login FROM users ORDER BY last_login DESC;

-- View active sessions
SELECT COUNT(*) FROM session WHERE expire > NOW();

-- Clear all sessions (logout all users)
DELETE FROM session;
```

<!-- {
  "web": {
     "832740265004-69mf2h0nbs4toa3ve4iskam452as87d8.apps.googleusercontent.com",
    "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"
  }
} -->
