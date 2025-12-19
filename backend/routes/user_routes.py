from flask import Blueprint, jsonify, session
from services.auth_service import get_user_by_id

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

