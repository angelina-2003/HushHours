import bcrypt
from database import get_connection


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
        """,
        (username, display_name, hashed_password_str, avatar, age, gender, 0)
    )

    conn.commit()
    cur.close()
    conn.close()

    return True, "Registration successful"


def login_user(username, password):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""SELECT password FROM users WHERE username = %s""", (username,))

    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return False, "Invalid username or password"

    stored_hashed_password = row[0]

    # Step 2: compare entered password with stored hash
    password_bytes = password.encode("utf-8")
    stored_hash_bytes = stored_hashed_password.encode("utf-8")

    is_correct = bcrypt.checkpw(
        password_bytes,
        stored_hash_bytes
    )

    cur.close()
    conn.close()

    if is_correct:
        return True, "Login successful"
    else:
        return False, "Invalid username or password"
