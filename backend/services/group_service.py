from database import get_connection
from datetime import datetime

def create_group(group_name, created_by_user_id):
    """Create a new group"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Create the group
        cur.execute("""
            INSERT INTO groups (name, created_by, created_at)
            VALUES (%s, %s, NOW())
            RETURNING id, name, created_by, created_at
        """, (group_name, created_by_user_id))

        group = cur.fetchone()
        group_id = group[0]

        # Add creator as a member
        cur.execute("""
            INSERT INTO group_members (group_id, user_id, joined_at)
            VALUES (%s, %s, NOW())
        """, (group_id, created_by_user_id))

        conn.commit()
        cur.close()
        conn.close()

        return {
            "id": group[0],
            "name": group[1],
            "created_by": group[2],
            "created_at": group[3].isoformat() if group[3] else None
        }
    except Exception as e:
        print(f"[DEBUG group_service] Error creating group: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return None


def get_all_public_groups(user_id):
    """Get all public groups from database, showing whether user is a member"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if liked_groups table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'liked_groups'
            )
        """)
        liked_groups_table_exists = cur.fetchone()[0]
        
        # Build query with or without liked_groups check
        if liked_groups_table_exists:
            cur.execute("""
                SELECT 
                    g.id AS group_id,
                    g.name,
                    g.created_by,
                    g.created_at,
                    (
                        SELECT content 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_content,
                    (
                        SELECT timestamp 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_time,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM group_members gm2 
                            WHERE gm2.group_id = g.id AND gm2.user_id = %s
                        ) THEN TRUE 
                        ELSE FALSE 
                    END AS is_member,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM liked_groups lg 
                            WHERE lg.group_id = g.id AND lg.user_id = %s
                        ) THEN TRUE 
                        ELSE FALSE 
                    END AS is_liked
                FROM groups g
                ORDER BY 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM group_members gm3 
                            WHERE gm3.group_id = g.id AND gm3.user_id = %s
                        ) THEN 0 
                        ELSE 1 
                    END,
                    COALESCE((
                        SELECT timestamp 
                        FROM group_messages gm4 
                        WHERE gm4.group_id = g.id 
                        ORDER BY gm4.timestamp DESC 
                        LIMIT 1
                    ), g.created_at) DESC
            """, (user_id, user_id, user_id))
        else:
            # Query without liked_groups check
            cur.execute("""
                SELECT 
                    g.id AS group_id,
                    g.name,
                    g.created_by,
                    g.created_at,
                    (
                        SELECT content 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_content,
                    (
                        SELECT timestamp 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_time,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM group_members gm2 
                            WHERE gm2.group_id = g.id AND gm2.user_id = %s
                        ) THEN TRUE 
                        ELSE FALSE 
                    END AS is_member,
                    FALSE AS is_liked
                FROM groups g
                ORDER BY 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM group_members gm3 
                            WHERE gm3.group_id = g.id AND gm3.user_id = %s
                        ) THEN 0 
                        ELSE 1 
                    END,
                    COALESCE((
                        SELECT timestamp 
                        FROM group_messages gm4 
                        WHERE gm4.group_id = g.id 
                        ORDER BY gm4.timestamp DESC 
                        LIMIT 1
                    ), g.created_at) DESC
            """, (user_id, user_id))

        rows = cur.fetchall()
        print(f"[DEBUG group_service] Found {len(rows)} groups in database")
        
        # Check total groups count
        cur.execute("SELECT COUNT(*) FROM groups")
        total_groups = cur.fetchone()[0]
        print(f"[DEBUG group_service] Total groups in database: {total_groups}")
        
        cur.close()
        conn.close()

        groups = []
        for row in rows:
            groups.append({
                "group_id": row[0],
                "name": row[1],
                "created_by": row[2],
                "created_at": row[3].isoformat() if row[3] else None,
                "last_message_content": row[4],
                "last_message_time": row[5].isoformat() if row[5] else None,
                "is_member": row[6],
                "is_liked": row[7] if len(row) > 7 else False
            })

        return groups
    except Exception as e:
        print(f"[DEBUG group_service] Error getting groups: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return []


def get_group_messages(group_id, user_id):
    """Get all messages for a group (public groups allow viewing even if not a member)"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # First verify group exists
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return None  # Group doesn't exist
        
        # Allow viewing messages even if not a member (for public groups)
        # Get messages
        cur.execute("""
            SELECT 
                gm.id,
                gm.group_id,
                gm.sender_id,
                gm.content,
                gm.timestamp,
                u.username,
                u.display_name,
                u.avatar_key
            FROM group_messages gm
            JOIN users u ON gm.sender_id = u.id
            WHERE gm.group_id = %s
            ORDER BY gm.timestamp ASC
        """, (group_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        messages = []
        for row in rows:
            messages.append({
                "id": row[0],
                "group_id": row[1],
                "sender_id": row[2],
                "content": row[3],
                "timestamp": row[4].isoformat() if row[4] else None,
                "sender_username": row[5],
                "sender_display_name": row[6] or row[5],
                "sender_avatar": row[7]
            })

        return messages
    except Exception as e:
        print(f"[DEBUG group_service] Error getting group messages: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return None


def send_group_message(group_id, sender_id, content):
    """Send a message to a group"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify user is a member
        cur.execute("""
            SELECT 1 FROM group_members 
            WHERE group_id = %s AND user_id = %s
        """, (group_id, sender_id))

        if not cur.fetchone():
            cur.close()
            conn.close()
            return None  # User is not a member

        # Insert message
        cur.execute("""
            INSERT INTO group_messages (group_id, sender_id, content, timestamp)
            VALUES (%s, %s, %s, NOW())
            RETURNING id, group_id, sender_id, content, timestamp
        """, (group_id, sender_id, content))

        message = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {
            "id": message[0],
            "group_id": message[1],
            "sender_id": message[2],
            "content": message[3],
            "timestamp": message[4].isoformat() if message[4] else None
        }
    except Exception as e:
        print(f"[DEBUG group_service] Error sending group message: {e}")
        conn.rollback()
        try:
            cur.close()
            conn.close()
        except:
            pass
        return None


def get_group_info(group_id, user_id):
    """Get group information (only if user is a member)"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify user is a member
        cur.execute("""
            SELECT 1 FROM group_members 
            WHERE group_id = %s AND user_id = %s
        """, (group_id, user_id))

        if not cur.fetchone():
            cur.close()
            conn.close()
            return None

        # Get group info
        cur.execute("""
            SELECT id, name, created_by, created_at
            FROM groups
            WHERE id = %s
        """, (group_id,))

        group = cur.fetchone()
        if not group:
            cur.close()
            conn.close()
            return None

        # Get members
        cur.execute("""
            SELECT 
                u.id,
                u.username,
                u.display_name,
                u.avatar_key,
                gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = %s
            ORDER BY gm.joined_at ASC
        """, (group_id,))

        members = []
        for row in cur.fetchall():
            members.append({
                "user_id": row[0],
                "username": row[1],
                "display_name": row[2] or row[1],
                "avatar": row[3],
                "joined_at": row[4].isoformat() if row[4] else None
            })

        cur.close()
        conn.close()

        return {
            "id": group[0],
            "name": group[1],
            "created_by": group[2],
            "created_at": group[3].isoformat() if group[3] else None,
            "members": members
        }
    except Exception as e:
        print(f"[DEBUG group_service] Error getting group info: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return None


def add_member_to_group(group_id, user_id, added_by_user_id=None):
    """Add a user to a group. For public groups, anyone can join."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if user is already a member
        cur.execute("""
            SELECT 1 FROM group_members 
            WHERE group_id = %s AND user_id = %s
        """, (group_id, user_id))

        if cur.fetchone():
            cur.close()
            conn.close()
            return True  # Already a member

        # Add member (public groups allow anyone to join)
        cur.execute("""
            INSERT INTO group_members (group_id, user_id, joined_at)
            VALUES (%s, %s, NOW())
        """, (group_id, user_id))

        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[DEBUG group_service] Error adding member: {e}")
        conn.rollback()
        try:
            cur.close()
            conn.close()
        except:
            pass
        return False


def get_user_joined_groups(user_id):
    """Get only groups that the user has actually joined (is a member of)"""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if liked_groups table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'liked_groups'
            )
        """)
        liked_groups_table_exists = cur.fetchone()[0]
        
        # Build query to get only groups where user is a member
        if liked_groups_table_exists:
            cur.execute("""
                SELECT 
                    g.id AS group_id,
                    g.name,
                    g.created_by,
                    g.created_at,
                    (
                        SELECT content 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_content,
                    (
                        SELECT timestamp 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_time,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM liked_groups lg 
                            WHERE lg.group_id = g.id AND lg.user_id = %s
                        ) THEN TRUE 
                        ELSE FALSE 
                    END AS is_liked
                FROM groups g
                INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = %s
                ORDER BY COALESCE((
                    SELECT timestamp 
                    FROM group_messages gm2 
                    WHERE gm2.group_id = g.id 
                    ORDER BY gm2.timestamp DESC 
                    LIMIT 1
                ), g.created_at) DESC
            """, (user_id, user_id))
        else:
            # Query without liked_groups check
            cur.execute("""
                SELECT 
                    g.id AS group_id,
                    g.name,
                    g.created_by,
                    g.created_at,
                    (
                        SELECT content 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_content,
                    (
                        SELECT timestamp 
                        FROM group_messages gm 
                        WHERE gm.group_id = g.id 
                        ORDER BY gm.timestamp DESC 
                        LIMIT 1
                    ) AS last_message_time,
                    FALSE AS is_liked
                FROM groups g
                INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = %s
                ORDER BY COALESCE((
                    SELECT timestamp 
                    FROM group_messages gm2 
                    WHERE gm2.group_id = g.id 
                    ORDER BY gm2.timestamp DESC 
                    LIMIT 1
                ), g.created_at) DESC
            """, (user_id,))
        
        rows = cur.fetchall()
        print(f"[DEBUG group_service] User {user_id} is a member of {len(rows)} groups")
        
        cur.close()
        conn.close()

        groups = []
        for row in rows:
            groups.append({
                "group_id": row[0],
                "name": row[1],
                "created_by": row[2],
                "created_at": row[3].isoformat() if row[3] else None,
                "last_message_content": row[4],
                "last_message_time": row[5].isoformat() if row[5] else None,
                "is_liked": row[6] if len(row) > 6 else False
            })

        return groups
    except Exception as e:
        print(f"[DEBUG group_service] Error getting user joined groups: {e}")
        import traceback
        traceback.print_exc()
        try:
            cur.close()
            conn.close()
        except:
            pass
        return []

