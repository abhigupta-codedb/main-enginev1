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
# Run initial schema (creates users and session tables)
psql -U main_user -d main_enginev1 -h localhost -f database/schema.sql

# Run extended schema (creates user profiles, approvers, and recipients tables)
psql -U main_user -d main_enginev1 -h localhost -f database/extended_schema.sql

# Run notes schema (creates user notes table with recipient associations)
psql -U main_user -d main_enginev1 -h localhost -f database/notes_schema.sql
```

### Option 2: Using Docker

1. **Start PostgreSQL with Docker:**

```bash
docker run --name main-engine-postgres \
  -e POSTGRES_DB=main_enginev1 \
  -e POSTGRES_USER=main_user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

2. **Run schema setup:**

```bash
# Run initial schema
docker exec -i main-engine-postgres psql -U main_user -d main_enginev1 < database/schema.sql

# Run extended schema
docker exec -i main-engine-postgres psql -U main_user -d main_enginev1 < database/extended_schema.sql

# Run notes schema

docker exec -i main-engine-postgres psql -U main_user -d main_enginev1 < database/notes_schema.sql
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
DATABASE_URL=postgresql://main_user:password@localhost:5432/main_enginev1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=main_enginev1
DB_USER=main_user
DB_PASSWORD=password
```

## Verify Setup

1. Start your server: `npm run dev`
2. Check the console for: `✅ Connected to PostgreSQL database`
3. Visit: `http://localhost:3000/login`
4. Sign in with Google
5. Check `http://localhost:3000/api/users` to see your user stored in PostgreSQL

## Database Schema

The application creates these tables:

### Core Tables (from `database/schema.sql`):

- **users**: Stores Google OAuth user data
- **session**: Stores Express sessions

### Extended Tables (from `database/extended_schema.sql`):

- **user_profiles**: Stores extended user profile information
- **user_approvers**: Stores multiple approvers per user
- **user_recipients**: Stores multiple recipients per user

### Notes Tables (from `database/notes_schema.sql`):

- **user_notes**: Stores user notes with attachments and associated recipients

### Table Structures:

#### **users** Table:

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

#### **user_profiles** Table:

```sql
id SERIAL PRIMARY KEY,
user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
age INTEGER,
contact_number_1 VARCHAR(20),
contact_number_2 VARCHAR(20),
instagram_handle VARCHAR(100),
linkedin_profile VARCHAR(255),
twitter_handle VARCHAR(100),
facebook_profile VARCHAR(255),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

#### **user_approvers** Table:

```sql
id SERIAL PRIMARY KEY,
user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
approver_name VARCHAR(255) NOT NULL,
approver_email VARCHAR(255) NOT NULL,
approver_contact_number_1 VARCHAR(20),
approver_contact_number_2 VARCHAR(20),
approver_relationship VARCHAR(100), -- e.g., "Manager", "HR", "Friend", "Family"
approver_instagram VARCHAR(100),
approver_linkedin VARCHAR(255),
approver_twitter VARCHAR(100),
approver_facebook VARCHAR(255),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

#### **user_recipients** Table:

```sql
id SERIAL PRIMARY KEY,
user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
recipient_name VARCHAR(255) NOT NULL,
recipient_email VARCHAR(255) NOT NULL,
recipient_contact_number_1 VARCHAR(20),
recipient_contact_number_2 VARCHAR(20),
recipient_relationship VARCHAR(100), -- e.g., "Manager", "HR", "Friend", "Family"
recipient_instagram VARCHAR(100),
recipient_linkedin VARCHAR(255),
recipient_twitter VARCHAR(100),
recipient_facebook VARCHAR(255),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

#### **user_notes** Table:

```sql
id SERIAL PRIMARY KEY,
user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
note TEXT NOT NULL,
attachment TEXT, -- URL/path to image attachment
recipient_ids INTEGER[], -- Array of recipient IDs from user_recipients table
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

### Indexes:

- `idx_user_profiles_user_id` on `user_profiles(user_id)`
- `idx_user_approvers_user_id` on `user_approvers(user_id)`
- `idx_user_approvers_email` on `user_approvers(approver_email)`
- `idx_user_recipients_user_id` on `user_recipients(user_id)`

### Triggers:

- **update_updated_at_column()**: Function that updates `updated_at` timestamp
- Applied to: `user_profiles`, `user_approvers`, `user_recipients`

## Useful PostgreSQL Commands

### **User Management Queries:**

```sql
-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- View recent logins
SELECT name, email, last_login FROM users ORDER BY last_login DESC;

-- View users with complete profiles
SELECT u.name, u.email, up.age, up.contact_number_1
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;
```

### **Profile & Relationship Queries:**

```sql
-- View user with their approvers
SELECT u.name as user_name, ua.approver_name, ua.approver_relationship
FROM users u
LEFT JOIN user_approvers ua ON u.id = ua.user_id
ORDER BY u.name, ua.approver_name;

-- View user with their recipients
SELECT u.name as user_name, ur.recipient_name, ur.recipient_relationship
FROM users u
LEFT JOIN user_recipients ur ON u.id = ur.user_id
ORDER BY u.name, ur.recipient_name;

-- Check users with insufficient approvers (less than 2)
SELECT u.name, u.email, COUNT(ua.id) as approver_count
FROM users u
LEFT JOIN user_approvers ua ON u.id = ua.user_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(ua.id) < 2;

-- Get full profile with all relationships
SELECT
    u.name as user_name,
    u.email,
    up.age,
    up.contact_number_1,
    COUNT(DISTINCT ua.id) as approver_count,
    COUNT(DISTINCT ur.id) as recipient_count
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_approvers ua ON u.id = ua.user_id
LEFT JOIN user_recipients ur ON u.id = ur.user_id
GROUP BY u.id, u.name, u.email, up.age, up.contact_number_1;
```

### **Session Management:**

```sql
-- View active sessions
SELECT COUNT(*) FROM session WHERE expire > NOW();

-- Clear all sessions (logout all users)
DELETE FROM session;
```

### **Data Cleanup:**

```sql
-- Remove expired sessions
DELETE FROM session WHERE expire < NOW();

-- View table sizes and statistics
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename IN ('users', 'user_profiles', 'user_approvers', 'user_recipients');
```

## API Endpoints

The application provides the following REST API endpoints:

### **Authentication Endpoints:**

- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout user
- `GET /protected` - Test protected route (requires authentication)

### **Basic User Endpoints:**

- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update basic user profile (name, picture)

### **Extended Profile Endpoints:**

- `GET /api/users/profile/complete` - Get complete profile with approvers and recipients
- `PUT /api/users/profile/extended` - Create/update extended profile with social info

### **Approver Management Endpoints:**

- `POST /api/users/profile/approvers` - Add new approver
- `PUT /api/users/profile/approvers/:approverId` - Update existing approver
- `DELETE /api/users/profile/approvers/:approverId` - Delete approver

### **Recipient Management Endpoints:**

- `POST /api/users/profile/recipients` - Add new recipient
- `PUT /api/users/profile/recipients/:recipientId` - Update existing recipient
- `DELETE /api/users/profile/recipients/:recipientId` - Delete recipient

### **Notes Management Endpoints:**

- `GET /api/users/notes` - Get all notes for current user
- `POST /api/users/notes` - Add new note
- `GET /api/users/notes/:noteId` - Get single note by ID
- `PUT /api/users/notes/:noteId` - Update existing note
- `DELETE /api/users/notes/:noteId` - Delete note

### **Example API Requests:**

#### Create Extended Profile:

```json
PUT /api/users/profile/extended
{
  "age": 30,
  "contactNumber1": "+1-555-123-4567",
  "contactNumber2": "+1-555-987-6543",
  "instagramHandle": "@johndoe",
  "linkedinProfile": "https://linkedin.com/in/johndoe",
  "twitterHandle": "@johndoe",
  "facebookProfile": "https://facebook.com/johndoe"
}
```

#### Add Approver:

```json
POST /api/users/profile/approvers
{
  "approverName": "Jane Smith",
  "approverEmail": "jane.smith@company.com",
  "approverContactNumber1": "+1-555-444-5555",
  "approverRelationship": "Manager",
  "approverLinkedin": "https://linkedin.com/in/janesmith"
}
```

#### Add Recipient:

```json
POST /api/users/profile/recipients
{
  "recipientName": "John Doe Jr.",
  "recipientEmail": "john.jr@example.com",
  "recipientContactNumber1": "+1-555-777-8888",
  "recipientRelationship": "Son",
  "recipientInstagram": "@johnjr"
}
```

#### Add Note:

```json
POST /api/users/notes
{
  "note": "Important reminder about project deadline",
  "attachment": "https://example.com/deadline-reminder.png",
  "recipientIds": [1, 2, 3]
}
```

#### Update Note:

```json
PUT /api/users/notes/1
{
  "note": "Updated reminder with more details",
  "recipientIds": [1, 2]
}
```

**Note**: When retrieving notes via `GET /api/users/notes` or `GET /api/users/profile/complete`, each note will include complete recipient information with all fields (name, email, contact numbers, social media handles, etc.) for each recipient ID specified.

## Business Rules & Constraints

1. **Minimum Approvers**: Each user should have at least 2 approvers (enforced in application logic)
2. **Email Validation**: All email fields use standard email format validation
3. **Age Constraints**: Age must be between 13 and 120 when provided
4. **Required Fields**:
   - Extended Profile: `contactNumber1` is required
   - Approvers: `approverName` and `approverEmail` are required
   - Recipients: `recipientName` and `recipientEmail` are required
5. **Automatic Timestamps**: All profile tables have automatic `created_at` and `updated_at` timestamps with triggers
6. **Cascade Deletion**: When a user is deleted, all related profiles, approvers, and recipients are automatically deleted

## Database Concepts Explained

### **Sessions:**

Sessions store user login state server-side. When you log in with Google, a session is created in the database that maps to a session cookie in your browser. This is more secure than client-side storage and allows server-side session management.

### **Triggers:**

Database triggers automatically execute when certain events occur. Our `update_updated_at_column()` trigger runs before any UPDATE operation on profile tables, automatically setting the `updated_at` field to the current timestamp.

### **Indexing:**

Indexes speed up database queries by creating a sorted structure for fast lookups. We index frequently-queried columns like `user_id` and `email` to ensure fast profile and relationship lookups even with large datasets.

### **Foreign Key Relationships:**

Foreign keys maintain data integrity by ensuring referenced records exist. Our `user_id` foreign keys in profile tables prevent orphaned records and enable cascading deletes when users are removed.
