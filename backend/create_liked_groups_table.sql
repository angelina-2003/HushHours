-- Create liked_groups table for storing user's liked groups
CREATE TABLE IF NOT EXISTS liked_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_liked_groups_user_id ON liked_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_groups_group_id ON liked_groups(group_id);

