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

    conversation_id = get_or_create_conversation(user_id, other_user_id)
    
    if conversation_id:
        return jsonify({"success": True, "conversation_id": conversation_id})
    else:
        return jsonify({"error": "Failed to create conversation"}), 500

