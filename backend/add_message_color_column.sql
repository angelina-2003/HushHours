-- Add message_color column to users table with default grey color
-- Run this script to add the message_color column if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'message_color'
    ) THEN
        ALTER TABLE users ADD COLUMN message_color VARCHAR(7) DEFAULT '#6b7280';
        RAISE NOTICE 'message_color column added successfully';
    ELSE
        RAISE NOTICE 'message_color column already exists';
    END IF;
END $$;

