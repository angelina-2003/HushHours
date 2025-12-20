from database import get_connection

def search_users_by_username(search_term, current_user_id):
    """Search for users by username (not display name)"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Search for users with exact username match (case-insensitive)
        # Exclude the current user and users already in friends list
        cur.execute("""
            SELECT 
                u.id,
                u.username,
                u.display_name,
                u.avatar_key,
                u.points,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM conversations c 
                        WHERE (c.user1_id = %s AND c.user2_id = u.id) 
                        OR (c.user2_id = %s AND c.user1_id = u.id)
                    ) THEN TRUE 
                    ELSE FALSE 
                END AS has_conversation
            FROM users u
            WHERE LOWER(u.username) = LOWER(%s)
            AND u.id != %s
            ORDER BY u.username ASC
            LIMIT 20
        """, (current_user_id, current_user_id, search_term, current_user_id))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        users = []
        for row in rows:
            users.append({
                "user_id": row[0],
                "username": row[1],
                "display_name": row[2] or row[1],
                "avatar": row[3],
                "points": row[4] or 0,
                "has_conversation": row[5]
            })

        return users
    except Exception as e:
        print(f"[DEBUG user_search_service] Error searching users: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return []


def get_or_create_conversation(user1_id, user2_id):
    """Get existing conversation or create a new one"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        print(f"[DEBUG user_search_service] get_or_create_conversation called: user1_id={user1_id}, user2_id={user2_id}")
        
        # Check if conversation already exists
        cur.execute("""
            SELECT id FROM conversations 
            WHERE (user1_id = %s AND user2_id = %s) 
            OR (user2_id = %s AND user1_id = %s)
            LIMIT 1
        """, (user1_id, user2_id, user1_id, user2_id))

        row = cur.fetchone()
        
        if row:
            # Conversation exists
            conversation_id = row[0]
            print(f"[DEBUG user_search_service] Found existing conversation: {conversation_id}")
            cur.close()
            conn.close()
            return conversation_id
        
        # Create new conversation
        print(f"[DEBUG user_search_service] Creating new conversation between {user1_id} and {user2_id}")
        cur.execute("""
            INSERT INTO conversations (user1_id, user2_id)
            VALUES (%s, %s)
            RETURNING id
        """, (user1_id, user2_id))
        
        conversation_id = cur.fetchone()[0]
        conn.commit()
        print(f"[DEBUG user_search_service] Created new conversation: {conversation_id}")
        cur.close()
        conn.close()
        
        return conversation_id
    except Exception as e:
        print(f"[DEBUG user_search_service] Error getting/creating conversation: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        try:
            cur.close()
            conn.close()
        except:
            pass
        return None

