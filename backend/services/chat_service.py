from database import get_connection

def get_conversations_for_user(user_id):
    conn = get_connection()
    cur = conn.cursor()

    # Ensure user_id is an integer
    if not user_id:
        print(f"[DEBUG chat.py] user_id is None or falsy, returning empty list")
        return []

    # Convert to int if it's not already
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        print(f"[DEBUG chat.py] user_id cannot be converted to int: {user_id}")
        return []

    print(f"[DEBUG chat.py] Querying conversations for user_id: {user_id}")
    
    # First, check ALL conversations in database
    cur.execute("SELECT COUNT(*) FROM conversations")
    total_convos = cur.fetchone()[0]
    print(f"[DEBUG chat.py] Total conversations in entire database: {total_convos}")
    
    # Check all conversations for this user
    cur.execute("""
        SELECT id, user1_id, user2_id 
        FROM conversations 
        WHERE user1_id = %s OR user2_id = %s
    """, (user_id, user_id))
    all_convos = cur.fetchall()
    print(f"[DEBUG chat.py] Total conversations for user {user_id}: {len(all_convos)}")
    for conv in all_convos:
        other_id = conv[2] if conv[1] == user_id else conv[1]
        print(f"  - Conversation {conv[0]}: user1={conv[1]}, user2={conv[2]}, other_user_id={other_id}")
    
    # Also check conversations for user 8 (demo3) if different
    if user_id != 8:
        cur.execute("""
            SELECT id, user1_id, user2_id 
            FROM conversations 
            WHERE user1_id = 8 OR user2_id = 8
        """)
        user8_convos = cur.fetchall()
        print(f"[DEBUG chat.py] Total conversations for user 8 (demo3): {len(user8_convos)}")
        for conv in user8_convos:
            other_id = conv[2] if conv[1] == 8 else conv[1]
            print(f"  - Conversation {conv[0]}: user1={conv[1]}, user2={conv[2]}, other_user_id={other_id}")
    
    # Now check if other users exist
    for conv in all_convos:
        other_id = conv[2] if conv[1] == user_id else conv[1]
        cur.execute("SELECT id, username FROM users WHERE id = %s", (other_id,))
        other_user = cur.fetchone()
        if not other_user:
            print(f"[WARNING] Conversation {conv[0]} has other_user_id {other_id} which doesn't exist in users table!")
        else:
            print(f"[DEBUG] Conversation {conv[0]} - other user exists: {other_user[1]} (id: {other_user[0]})")
    
    cur.execute("""
        SELECT
            c.id AS conversation_id,
            u.id AS other_user_id,
            u.username AS other_username,
            u.display_name AS other_display_name,
            u.avatar_key AS other_avatar,
            (SELECT MAX(timestamp) FROM messages WHERE conversation_id = c.id) AS last_message_time,
            (SELECT content FROM messages 
             WHERE conversation_id = c.id 
             ORDER BY timestamp DESC, id DESC LIMIT 1) AS last_message_content
        FROM conversations c
        JOIN users u
          ON u.id = CASE
              WHEN c.user1_id = %s THEN c.user2_id
              ELSE c.user1_id
            END
        WHERE c.user1_id = %s OR c.user2_id = %s
        ORDER BY 
            (SELECT MAX(timestamp) FROM messages WHERE conversation_id = c.id) DESC NULLS LAST,
            c.id DESC
    """, (user_id, user_id, user_id))

    rows = cur.fetchall()
    print(f"[DEBUG chat.py] Found {len(rows)} conversations in database")
    
    # Also check raw conversation count
    cur.execute("""
        SELECT COUNT(*) FROM conversations 
        WHERE user1_id = %s OR user2_id = %s
    """, (user_id, user_id))
    raw_count = cur.fetchone()[0]
    print(f"[DEBUG chat.py] Raw conversation count (no JOIN): {raw_count}")

    conversations = []

    for row in rows:
        # Verify last message content
        if row[6]:
            cur2 = conn.cursor()
            cur2.execute("""
                SELECT content, timestamp, id 
                FROM messages 
                WHERE conversation_id = %s 
                ORDER BY timestamp DESC, id DESC 
                LIMIT 3
            """, (row[0],))
            recent_msgs = cur2.fetchall()
            cur2.close()
            if recent_msgs:
                print(f"[DEBUG] Conversation {row[0]} - Last 3 messages:")
                for msg in recent_msgs:
                    print(f"  - {msg[0]} (timestamp: {msg[1]}, id: {msg[2]})")
                print(f"[DEBUG] Using preview: {row[6]}")
        
        conversations.append({
            "conversation_id": row[0],
            "other_user_id": row[1],
            "other_username": row[2],
            "other_display_name": row[3] or row[2],  # Use display_name, fallback to username
            "other_avatar": row[4],
            "last_message_time": row[5].isoformat() if row[5] else None,
            "last_message_content": row[6]
        })
        print(f"[DEBUG] Added conversation {row[0]} with user: {row[3] or row[2]} (id: {row[1]})")

    cur.close()
    conn.close()
    
    print(f"[DEBUG chat.py] Returning {len(conversations)} conversations to frontend")
    return conversations


def get_messages_for_conversation(conversation_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            m.id, 
            m.sender_id, 
            m.content, 
            m.timestamp,
            u.avatar_key
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = %s
        ORDER BY m.timestamp ASC, m.id ASC
    """, (conversation_id,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = []
    message_list = []
    for row in rows:
        timestamp = row[3]
        message_list.append({
            "id": row[0],
            "sender_id": row[1],
            "content": row[2],
            "timestamp": timestamp,  # Keep datetime object for sorting
            "sender_avatar": row[4]
        })

    # Sort by timestamp, then by ID to ensure correct chronological order
    # This handles cases where messages have the same timestamp
    message_list.sort(key=lambda x: (x["timestamp"] if x["timestamp"] else None, x["id"]))

    # Convert timestamps to ISO format for JSON response
    for msg in message_list:
        messages.append({
            "id": msg["id"],
            "sender_id": msg["sender_id"],
            "content": msg["content"],
            "created_at": msg["timestamp"].isoformat() if msg["timestamp"] else None,
            "timestamp": msg["timestamp"].isoformat() if msg["timestamp"] else None,
            "sender_avatar": msg["sender_avatar"]
        })

    return messages
