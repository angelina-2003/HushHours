import bcrypt
from database import get_connection
from services.gift_service import get_user_gifts


def register_user(username, display_name, age, gender, password, avatar):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(""" SELECT id FROM users WHERE username = %s """, (username,))
    
    row = cur.fetchone()

    if row:
        cur.close()
        conn.close()
        return False, "Username already taken"
    
    # hash password using bcrypt
    password_bytes = password.encode("utf-8")
    hashed_password = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )
    hashed_password_str = hashed_password.decode("utf-8")

    # insert new user
    cur.execute(
        """
        INSERT INTO users (username, display_name, password, avatar_key, age, gender, points)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (username, display_name, hashed_password_str, avatar, age, gender, 0)
    )

    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return True, user_id


def login_user(username, password):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, password, avatar_key FROM users WHERE username = %s",
        (username,)
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return False, None

    user_id = row[0]
    stored_hashed_password = row[1]
    avatar_key = row[2]

    password_bytes = password.encode("utf-8")
    stored_hash_bytes = stored_hashed_password.encode("utf-8")

    is_correct = bcrypt.checkpw(password_bytes, stored_hash_bytes)

    if not is_correct:
        return False, None

    return True, {
        "id": user_id,
        "avatar": avatar_key
    }



def get_user_by_id(user_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, username, display_name, avatar_key, age, gender, points FROM users WHERE id = %s",
        (user_id,)
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return None

    # Get user gifts (with error handling)
    try:
        gifts = get_user_gifts(row[0])
    except Exception as e:
        print(f"[DEBUG auth_service] Error getting gifts: {e}")
        gifts = {}

    return {
        "id": row[0],
        "username": row[1],
        "display_name": row[2],
        "avatar": row[3],
        "age": row[4],
        "gender": row[5],
        "hush_points": row[6] or 0,
        "gifts": gifts
    }
