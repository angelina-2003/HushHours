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
    cur.execute("""
        SELECT
            c.id AS conversation_id,
            u.id AS other_user_id,
            u.username AS other_username,
            u.avatar_key AS other_avatar,
            (SELECT MAX(timestamp) FROM messages WHERE conversation_id = c.id) AS last_message_time,
            (SELECT content FROM messages 
             WHERE conversation_id = c.id 
             ORDER BY timestamp DESC LIMIT 1) AS last_message_content
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
    cur.close()
    conn.close()

    conversations = []

    for row in rows:
        conversations.append({
            "conversation_id": row[0],
            "other_user_id": row[1],
            "other_username": row[2],
            "other_avatar": row[3],
            "last_message_time": row[4].isoformat() if row[4] else None,
            "last_message_content": row[5]
        })

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
