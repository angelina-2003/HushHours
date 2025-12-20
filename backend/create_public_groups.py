#!/usr/bin/env python3
"""
Script to create 20 public groups in the database
Run this once to populate the groups table
"""

from database import get_connection

GROUP_NAMES = [
    '🗽 New York City',
    '🎰 Gambling Arena',
    '📸 Selfie Club',
    '🔥 Live Pics Only',
    '💉 Tattoo and Beard',
    '🎲 Truth or Dare',
    '🌆 Tokyo Nights',
    '🎨 Art & Design',
    '🍕 Food Lovers',
    '🏖️ Miami Beach',
    '🎮 Gaming Zone',
    '💼 Business Network',
    '🎵 Music Vibes',
    '🏋️ Fitness Freaks',
    '✈️ Travel Buddies',
    '📚 Book Club',
    '🎬 Movie Buffs',
    '💻 Tech Talk',
    '🌍 London Calling',
    '🎪 Party People'
]

def create_public_groups():
    conn = get_connection()
    cur = conn.cursor()
    
    created_count = 0
    existing_count = 0
    
    for group_name in GROUP_NAMES:
        try:
            # Check if group already exists
            cur.execute("SELECT id FROM groups WHERE name = %s", (group_name,))
            if cur.fetchone():
                print(f"Group '{group_name}' already exists, skipping...")
                existing_count += 1
                continue
            
            # Create the group (using user_id 1 as creator, or first available user)
            cur.execute("SELECT id FROM users ORDER BY id LIMIT 1")
            creator_id = cur.fetchone()
            if not creator_id:
                print("ERROR: No users found in database. Please create a user first.")
                cur.close()
                conn.close()
                return
            
            creator_id = creator_id[0]
            
            cur.execute("""
                INSERT INTO groups (name, created_by, created_at)
                VALUES (%s, %s, NOW())
                RETURNING id
            """, (group_name, creator_id))
            
            group_id = cur.fetchone()[0]
            print(f"Created group '{group_name}' (id: {group_id})")
            created_count += 1
            
        except Exception as e:
            print(f"Error creating group '{group_name}': {e}")
            continue
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\nSummary:")
    print(f"  Created: {created_count} groups")
    print(f"  Already existed: {existing_count} groups")
    print(f"  Total: {created_count + existing_count} groups")

if __name__ == "__main__":
    print("Creating public groups...")
    create_public_groups()
    print("Done!")

