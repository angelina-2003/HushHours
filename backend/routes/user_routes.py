from flask import Blueprint, jsonify, request, session
from services.auth_service import get_user_by_id
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

