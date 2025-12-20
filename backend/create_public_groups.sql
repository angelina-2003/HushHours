-- Create 20 public groups with varied names and emojis
-- This script creates public groups that users can join

INSERT INTO groups (name, created_by, created_at) VALUES
('🗽 New York City', 1, NOW()),
('🎰 Gambling Arena', 1, NOW()),
('📸 Selfie Club', 1, NOW()),
('🔥 Live Pics Only', 1, NOW()),
('💉 Tattoo and Beard', 1, NOW()),
('🎲 Truth or Dare', 1, NOW()),
('🌆 Tokyo Nights', 1, NOW()),
('🎨 Art & Design', 1, NOW()),
('🍕 Food Lovers', 1, NOW()),
('🏖️ Miami Beach', 1, NOW()),
('🎮 Gaming Zone', 1, NOW()),
('💼 Business Network', 1, NOW()),
('🎵 Music Vibes', 1, NOW()),
('🏋️ Fitness Freaks', 1, NOW()),
('✈️ Travel Buddies', 1, NOW()),
('📚 Book Club', 1, NOW()),
('🎬 Movie Buffs', 1, NOW()),
('💻 Tech Talk', 1, NOW()),
('🌍 London Calling', 1, NOW()),
('🎪 Party People', 1, NOW())
ON CONFLICT DO NOTHING;

