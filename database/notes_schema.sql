-- Notes table for user notes with attachments and recipients
CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    attachment TEXT, -- URL/path to image attachment
    recipient_ids INTEGER[], -- Array of recipient IDs from user_recipients table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_recipient_ids ON user_notes USING GIN(recipient_ids);

-- Trigger to update updated_at column
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to validate recipient IDs exist in user_recipients table
CREATE OR REPLACE FUNCTION validate_recipient_ids(user_id_param VARCHAR(255), recipient_ids_param INTEGER[])
RETURNS BOOLEAN AS $$
DECLARE
    recipient_id INTEGER;
    valid_count INTEGER;
BEGIN
    -- If no recipients specified, return true
    IF recipient_ids_param IS NULL OR array_length(recipient_ids_param, 1) IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check each recipient ID belongs to the user
    FOREACH recipient_id IN ARRAY recipient_ids_param
    LOOP
        SELECT COUNT(*) INTO valid_count 
        FROM user_recipients 
        WHERE id = recipient_id AND user_id = user_id_param;
        
        IF valid_count = 0 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
