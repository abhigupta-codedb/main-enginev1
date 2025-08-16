import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'main_enginev1',
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to try to connect before timing out
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

// Initialize database tables
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        provider VARCHAR(50) NOT NULL DEFAULT 'google',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table for express-session storage
     await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR PRIMARY KEY NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);

    // Create index on expire column for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
    `);

    // Create extended user profile tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_approvers (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        approver_name VARCHAR(255) NOT NULL,
        approver_email VARCHAR(255) NOT NULL,
        approver_contact_number_1 VARCHAR(20),
        approver_contact_number_2 VARCHAR(20),
        approver_relationship VARCHAR(100),
        approver_instagram VARCHAR(100),
        approver_linkedin VARCHAR(255),
        approver_twitter VARCHAR(100),
        approver_facebook VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_recipients (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_contact_number_1 VARCHAR(20),
        recipient_contact_number_2 VARCHAR(20),
        recipient_relationship VARCHAR(100),
        recipient_instagram VARCHAR(100),
        recipient_linkedin VARCHAR(255),
        recipient_twitter VARCHAR(100),
        recipient_facebook VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_approvers_user_id ON user_approvers(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_approvers_email ON user_approvers(approver_email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_recipients_user_id ON user_recipients(user_id)`);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Export the pool for use in other modules
export default pool;
