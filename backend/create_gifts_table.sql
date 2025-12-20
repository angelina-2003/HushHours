-- Create table for user gifts
CREATE TABLE IF NOT EXISTS user_gifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gift_type VARCHAR(50) NOT NULL,  -- e.g., '🎁', '💝', '🌹', '⭐'
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, gift_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_gifts_user_id ON user_gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gifts_type ON user_gifts(gift_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_gifts_updated_at BEFORE UPDATE ON user_gifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

