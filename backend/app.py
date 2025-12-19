from flask import Flask, request, jsonify, render_template, session
from routes.auth_routes import auth_bp
from routes.chat_routes import chat_bp
from routes.user_routes import user_bp
from services.auth_service import register_user, login_user, get_user_by_id
from services.chat_service import get_conversations_for_user, get_messages_for_conversation


app = Flask(__name__)
app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(user_bp)
app.secret_key = "dev-secret-change-later"


@app.route("/")
def home():
    return render_template("register.html")


@app.route("/app")
def app_page():
    return render_template("app.html")




if __name__ == "__main__":
    app.run(debug=True)
