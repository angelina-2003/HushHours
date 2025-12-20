from database import get_connection

def get_friends_for_user(user_id):
    """Get all friends (users the current user has chatted with)"""
    # Ensure user_id is an integer
    if not user_id:
        print(f"[DEBUG friend_service] user_id is None or falsy")
        return []
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        print(f"[DEBUG friend_service] user_id cannot be converted to int: {user_id}")
        return []
    
    print(f"[DEBUG friend_service] Getting friends for user_id: {user_id} (type: {type(user_id)})")
    conn = get_connection()
    cur = conn.cursor()

    try:
        # First, check how many conversations this user has
        cur.execute("""
            SELECT COUNT(*) FROM conversations 
            WHERE user1_id = %s OR user2_id = %s
        """, (user_id, user_id))
        conv_count = cur.fetchone()[0]
        print(f"[DEBUG friend_service] User {user_id} has {conv_count} conversations")
        
        # Test query to see what conversations exist
        cur.execute("""
            SELECT id, user1_id, user2_id FROM conversations 
            WHERE user1_id = %s OR user2_id = %s
            LIMIT 5
        """, (user_id, user_id))
        test_convos = cur.fetchall()
        print(f"[DEBUG friend_service] Sample conversations: {test_convos}")
        
        # Check if deleted_friends table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'deleted_friends'
            )
        """)
        table_exists = cur.fetchone()[0]
        print(f"[DEBUG friend_service] deleted_friends table exists: {table_exists}")

        if table_exists:
            # Get all users the current user has had conversations with, excluding deleted friends
            # Use GROUP BY instead of DISTINCT to allow ORDER BY
            cur.execute("""
                SELECT 
                    u.id AS friend_id,
                    u.username,
                    u.display_name,
                    u.avatar_key,
                    u.points,
                    MAX(c.id) AS conversation_id
                FROM conversations c
                JOIN users u ON (
                    (c.user1_id = %s AND u.id = c.user2_id) OR
                    (c.user2_id = %s AND u.id = c.user1_id)
                )
                LEFT JOIN deleted_friends df ON (
                    df.user_id = %s AND df.friend_id = u.id
                )
                WHERE (c.user1_id = %s OR c.user2_id = %s)
                AND df.id IS NULL
                GROUP BY u.id, u.username, u.display_name, u.avatar_key, u.points
                ORDER BY COALESCE(u.display_name, u.username) ASC
            """, (user_id, user_id, user_id, user_id, user_id))
        else:
            # Table doesn't exist yet, just get all friends without filtering
            # Use GROUP BY instead of DISTINCT to allow ORDER BY
            cur.execute("""
                SELECT 
                    u.id AS friend_id,
                    u.username,
                    u.display_name,
                    u.avatar_key,
                    u.points,
                    MAX(c.id) AS conversation_id
                FROM conversations c
                JOIN users u ON (
                    (c.user1_id = %s AND u.id = c.user2_id) OR
                    (c.user2_id = %s AND u.id = c.user1_id)
                )
                WHERE (c.user1_id = %s OR c.user2_id = %s)
                GROUP BY u.id, u.username, u.display_name, u.avatar_key, u.points
                ORDER BY COALESCE(u.display_name, u.username) ASC
            """, (user_id, user_id, user_id, user_id))

        rows = cur.fetchall()
        print(f"[DEBUG friend_service] Found {len(rows)} friends")
        
        friends = []
        for row in rows:
            friend_data = {
                "friend_id": row[0],
                "username": row[1],
                "display_name": row[2] or row[1],
                "avatar": row[3],
                "points": row[4] or 0,
                "conversation_id": row[5]
            }
            print(f"[DEBUG friend_service] Friend: {friend_data['display_name']} (id: {friend_data['friend_id']}, conv: {friend_data['conversation_id']})")
            friends.append(friend_data)

        cur.close()
        conn.close()
        print(f"[DEBUG friend_service] Returning {len(friends)} friends")
        return friends
        
    except Exception as e:
        print(f"[DEBUG friend_service] Error getting friends: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return []


def delete_friend(user_id, friend_id):
    """Delete a friend (mark as deleted in friends table or remove from list)"""
    # For now, we'll create a deleted_friends table to track deleted friends
    # This way we can filter them out but keep the conversation history
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if deleted_friends table exists, if not create it
        cur.execute("""
            CREATE TABLE IF NOT EXISTS deleted_friends (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id)
            )
        """)
        conn.commit()

        # Insert into deleted_friends
        cur.execute("""
            INSERT INTO deleted_friends (user_id, friend_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, friend_id) DO NOTHING
        """, (user_id, friend_id))

        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[DEBUG friend_service] Error deleting friend: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return False

