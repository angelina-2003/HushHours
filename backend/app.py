from flask import Flask, request, jsonify, render_template
from auth import register_user, login_user

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("register.html")


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


    success, message = register_user(
        username,
        display_name,
        age,
        gender,
        password,
        avatar
    )

    print("REGISTER RESULT:", success, message)

    if success:
        return jsonify({ "success": True})
    else:
        return jsonify({ "success": False, "error": message }), 400



@app.route("/login", methods=["POST"])
def login():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    success, message = login_user(username, password)

    if success:
        return jsonify({ "success": True })
    else:
        return jsonify({ "success": False, "error": message }), 401
    

if __name__ == "__main__":
    app.run(debug=True)
