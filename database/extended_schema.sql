-- Extended user profile table
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
);

-- Approvers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_approvers (
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
);

-- Recipients table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_recipients (
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
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvers_user_id ON user_approvers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvers_email ON user_approvers(approver_email);
CREATE INDEX IF NOT EXISTS idx_user_recipients_user_id ON user_recipients(user_id);

-- Triggers to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_approvers_updated_at ON user_approvers;
CREATE TRIGGER update_user_approvers_updated_at
    BEFORE UPDATE ON user_approvers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_recipients_updated_at ON user_recipients;
CREATE TRIGGER update_user_recipients_updated_at
    BEFORE UPDATE ON user_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Constraint: At least 2 active approvers per user
-- (This will be enforced in application logic)
