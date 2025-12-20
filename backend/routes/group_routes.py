from flask import Blueprint, jsonify, request, session
from services.group_service import (
    create_group,
    get_all_public_groups,
    get_group_messages,
    send_group_message,
    get_group_info,
    add_member_to_group
)

group_bp = Blueprint("group", __name__)


@group_bp.route("/groups", methods=["GET"])
def get_groups():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    # Get all public groups with membership status
    groups = get_all_public_groups(user_id)
    print(f"[DEBUG group_routes] Returning {len(groups)} groups to frontend")
    return jsonify(groups)


@group_bp.route("/groups", methods=["POST"])
def create_new_group():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    group_name = data.get("name", "").strip()

    if not group_name:
        return jsonify({"error": "Group name is required"}), 400

    group = create_group(group_name, user_id)

    if group:
        return jsonify(group), 201
    else:
        return jsonify({"error": "Failed to create group"}), 500


@group_bp.route("/groups/<int:group_id>/messages", methods=["GET"])
def get_messages(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    messages = get_group_messages(group_id, user_id)

    # Allow viewing messages even if not a member (for public groups)
    # Return empty array if group doesn't exist, otherwise return messages
    if messages is None:
        # Check if group exists
        from database import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        group_exists = cur.fetchone()
        cur.close()
        conn.close()
        
        if not group_exists:
            return jsonify({"error": "Group not found"}), 404
        
        # Group exists but user can't view messages (shouldn't happen for public groups)
        return jsonify([])  # Return empty array instead of error

    return jsonify(messages)


@group_bp.route("/groups/<int:group_id>/messages", methods=["POST"])
def send_message(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Message content is required"}), 400

    message = send_group_message(group_id, user_id, content)

    if message:
        return jsonify(message), 201
    else:
        return jsonify({"error": "Failed to send message or access denied"}), 403


@group_bp.route("/groups/<int:group_id>", methods=["GET"])
def get_group(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    group = get_group_info(group_id, user_id)

    if not group:
        return jsonify({"error": "Group not found or access denied"}), 403

    return jsonify(group)


@group_bp.route("/groups/<int:group_id>/members", methods=["POST"])
def add_member(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    # Verify group exists
    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Group not found"}), 404
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[DEBUG group_routes] Error checking group: {e}")
        try:
            cur.close()
            conn.close()
        except:
            pass
        return jsonify({"error": "Failed to verify group"}), 500

    # Use session user_id instead of request body
    # Allow users to join public groups (no need to be a member first)
    success = add_member_to_group(group_id, user_id, None)

    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to add member. You may already be a member or the group may not exist."}), 500


@group_bp.route("/groups/<int:group_id>/like", methods=["POST"])
def like_group(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Verify group exists
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Group not found"}), 404

        # Check if liked_groups table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'liked_groups'
            )
        """)
        liked_groups_table_exists = cur.fetchone()[0]
        
        if not liked_groups_table_exists:
            cur.close()
            conn.close()
            return jsonify({"error": "Liked groups feature not available yet. Please create the liked_groups table."}), 503

        # Check if already liked
        cur.execute(
            "SELECT id FROM liked_groups WHERE user_id = %s AND group_id = %s",
            (user_id, group_id)
        )
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"success": True, "is_liked": True})

        # Add to liked groups
        cur.execute(
            "INSERT INTO liked_groups (user_id, group_id) VALUES (%s, %s)",
            (user_id, group_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "is_liked": True})
    except Exception as e:
        print(f"[DEBUG group_routes] Error liking group: {e}")
        try:
            conn.rollback()
            cur.close()
            conn.close()
        except:
            pass
        return jsonify({"error": "Failed to like group"}), 500


@group_bp.route("/groups/<int:group_id>/like", methods=["DELETE"])
def unlike_group(group_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Verify group exists
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Group not found"}), 404

        # Check if liked_groups table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'liked_groups'
            )
        """)
        liked_groups_table_exists = cur.fetchone()[0]
        
        if not liked_groups_table_exists:
            cur.close()
            conn.close()
            return jsonify({"error": "Liked groups feature not available yet. Please create the liked_groups table."}), 503

        # Remove from liked groups
        cur.execute(
            "DELETE FROM liked_groups WHERE user_id = %s AND group_id = %s",
            (user_id, group_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "is_liked": False})
    except Exception as e:
        print(f"[DEBUG group_routes] Error unliking group: {e}")
        try:
            conn.rollback()
            cur.close()
            conn.close()
        except:
            pass
        return jsonify({"error": "Failed to unlike group"}), 500

