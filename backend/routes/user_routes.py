from flask import Blueprint, jsonify, request, session
from services.auth_service import get_user_by_id
from services.friend_service import get_friends_for_user, delete_friend
from services.user_search_service import search_users_by_username, get_or_create_conversation
from database import get_connection

user_bp = Blueprint("user", __name__)



@user_bp.route("/me")
def me():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({ "error": "Not logged in" }), 401

    user = get_user_by_id(user_id)

    if not user:
        return jsonify({ "error": "User not found" }), 404

    return jsonify(user)


@user_bp.route("/update-avatar", methods=["POST"])
def update_avatar():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    avatar = data.get("avatar")

    if not avatar:
        return jsonify({"error": "Avatar is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "UPDATE users SET avatar_key = %s WHERE id = %s",
        (avatar, user_id)
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True, "avatar": avatar})


@user_bp.route("/friends")
def get_friends():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    print(f"[DEBUG user_routes] /friends endpoint called for user_id: {user_id}")
    friends = get_friends_for_user(user_id)
    print(f"[DEBUG user_routes] Returning {len(friends)} friends")
    return jsonify(friends)


@user_bp.route("/friends/<int:friend_id>", methods=["DELETE"])
def remove_friend(friend_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    success = delete_friend(user_id, friend_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to delete friend"}), 500


@user_bp.route("/search-users")
def search_users():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    search_term = request.args.get("q", "").strip()
    
    if not search_term or len(search_term) < 1:
        return jsonify([])

    users = search_users_by_username(search_term, user_id)
    return jsonify(users)


@user_bp.route("/start-conversation", methods=["POST"])
def start_conversation():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    other_user_id = data.get("user_id")

    if not other_user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Ensure both IDs are integers
    try:
        user_id = int(user_id)
        other_user_id = int(other_user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user_id format"}), 400

    print(f"[DEBUG start-conversation] user_id={user_id} (type: {type(user_id)}), other_user_id={other_user_id} (type: {type(other_user_id)})")
    
    # Verify other user exists
    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id = %s", (other_user_id,))
    other_user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not other_user:
        print(f"[DEBUG start-conversation] ERROR: Other user {other_user_id} does not exist!")
        return jsonify({"error": "User not found"}), 404

    conversation_id = get_or_create_conversation(user_id, other_user_id)
    
    if conversation_id:
        print(f"[DEBUG start-conversation] Successfully created/found conversation: {conversation_id}")
        return jsonify({"success": True, "conversation_id": conversation_id})
    else:
        print(f"[DEBUG start-conversation] ERROR: Failed to create conversation")
        return jsonify({"error": "Failed to create conversation"}), 500


@user_bp.route("/message-color", methods=["GET"])
def get_message_color():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if message_color column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='message_color'
        """)
        column_exists = cur.fetchone()
        
        if not column_exists:
            # Column doesn't exist, return default
            cur.close()
            conn.close()
            return jsonify({"color": "#6b7280"})  # Default grey
        
        # Get user's message color
        cur.execute("SELECT message_color FROM users WHERE id = %s", (user_id,))
        result = cur.fetchone()
        
        message_color = result[0] if result and result[0] else "#6b7280"  # Default grey
        
        cur.close()
        conn.close()
        
        return jsonify({"color": message_color})
    except Exception as e:
        print(f"[DEBUG get_message_color] Error: {e}")
        cur.close()
        conn.close()
        return jsonify({"color": "#6b7280"})  # Default grey on error


@user_bp.route("/message-color", methods=["POST"])
def save_message_color():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    color = data.get("color")

    if not color:
        return jsonify({"error": "Color is required"}), 400

    # Validate color format (hex color)
    import re
    if not re.match(r'^#[0-9A-Fa-f]{6}$', color):
        return jsonify({"error": "Invalid color format"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if message_color column exists, if not create it
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='message_color'
        """)
        column_exists = cur.fetchone()
        
        if not column_exists:
            # Add the column
            cur.execute("ALTER TABLE users ADD COLUMN message_color VARCHAR(7) DEFAULT '#6b7280'")
            conn.commit()
        
        # Update user's message color
        cur.execute(
            "UPDATE users SET message_color = %s WHERE id = %s",
            (color, user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "color": color})
    except Exception as e:
        print(f"[DEBUG save_message_color] Error: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": "Failed to save message color"}), 500

