from database import get_connection

def get_user_gifts(user_id):
    """Get all gifts for a user with their counts"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if table exists first
        cur.execute(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_gifts'
            )
            """
        )
        table_exists = cur.fetchone()[0]

        if not table_exists:
            cur.close()
            conn.close()
            return {}

        cur.execute(
            """
            SELECT gift_type, count 
            FROM user_gifts 
            WHERE user_id = %s
            ORDER BY gift_type
            """,
            (user_id,)
        )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        # Convert to dictionary for easy lookup
        gifts_dict = {row[0]: row[1] for row in rows}
        return gifts_dict
    except Exception as e:
        print(f"[DEBUG gift_service] Error fetching gifts: {e}")
        # Return empty dict if there's any error (table doesn't exist, etc.)
        return {}

