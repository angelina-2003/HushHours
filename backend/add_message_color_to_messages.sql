-- Add message_color column to messages and group_messages tables
-- This allows each message to store the sender's chosen message color

-- Add to messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'message_color'
    ) THEN
        ALTER TABLE messages ADD COLUMN message_color VARCHAR(7) DEFAULT '#6b7280';
        RAISE NOTICE 'message_color column added to messages table';
    ELSE
        RAISE NOTICE 'message_color column already exists in messages table';
    END IF;
END $$;

-- Add to group_messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'group_messages' AND column_name = 'message_color'
    ) THEN
        ALTER TABLE group_messages ADD COLUMN message_color VARCHAR(7) DEFAULT '#6b7280';
        RAISE NOTICE 'message_color column added to group_messages table';
    ELSE
        RAISE NOTICE 'message_color column already exists in group_messages table';
    END IF;
END $$;

