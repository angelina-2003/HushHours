from flask import Flask, request, jsonify, render_template, session
from auth import register_user, login_user
from auth import get_user_by_id
from chat import get_conversations_for_user, get_messages_for_conversation

app = Flask(__name__)
app.secret_key = "dev-secret-change-later"


@app.route("/")
def home():
    return render_template("register.html")


@app.route("/app")
def app_page():
    return render_template("app.html")


@app.route("/register", methods=["POST"])
def register():
    print("REGISTER ENDPOINT HIT")
    data = request.json
    print("DATA RECEIVED:", data)

    username = data.get("username")
    display_name = data.get("display_name")
    age = data.get("age")
    gender = data.get("gender")
    password = data.get("password")
    avatar = data.get("avatar")


    success, result = register_user(
        username,
        display_name,
        age,
        gender,
        password,
        avatar
    )

    print("REGISTER RESULT:", success, result)

    if success:
        # Get the newly created user's ID and set session
        user = get_user_by_id(result)  # register_user now returns user_id on success
        if user:
            session["user_id"] = user["id"]
            print(f"Session set for user_id: {user['id']}")
        return jsonify({ "success": True})
    else:
        return jsonify({ "success": False, "error": result }), 400



@app.route("/login", methods=["POST"])
def login():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    success, user = login_user(username, password)

    if not success:
        return jsonify({ "success": False }), 401
    
    session["user_id"] = user["id"]

    return jsonify({"success": True})


@app.route("/conversations")
def conversations():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    print(f"[DEBUG] Fetching conversations for user_id: {user_id} (type: {type(user_id)})")
    data = get_conversations_for_user(user_id)
    print(f"[DEBUG] Returning {len(data)} conversations")
    for conv in data:
        print(f"  - Conversation {conv['conversation_id']} with user: {conv['other_username']} (id: {conv['other_user_id']})")
    return jsonify(data)


@app.route("/conversations/<int:conversation_id>/messages")
def conversation_messages(conversation_id):
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    # Verify user is part of this conversation
    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM conversations WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
        (conversation_id, user_id, user_id)
    )
    if not cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Conversation not found or access denied"}), 403
    
    cur.close()
    conn.close()

    messages = get_messages_for_conversation(conversation_id)
    return jsonify(messages)



@app.route("/messages", methods=["POST"])
def send_message():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    conversation_id = data.get("conversation_id")
    content = data.get("content")

    if not conversation_id or not content:
        return jsonify({"error": "Missing conversation_id or content"}), 400

    # Verify user is part of this conversation
    from database import get_connection
    from datetime import datetime
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT id FROM conversations WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
        (conversation_id, user_id, user_id)
    )
    if not cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Conversation not found or access denied"}), 403

    # Insert message
    cur.execute(
        "INSERT INTO messages (conversation_id, sender_id, content, timestamp) VALUES (%s, %s, %s, %s)",
        (conversation_id, user_id, content, datetime.now())
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})


@app.route("/me")
def me():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({ "error": "Not logged in" }), 401

    user = get_user_by_id(user_id)

    if not user:
        return jsonify({ "error": "User not found" }), 404

    return jsonify(user)




if __name__ == "__main__":
    app.run(debug=True)
