from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from db import init_db, close_db
from posts import posts_bp
from users import users_bp
from tags import tags_bp

load_dotenv()

app = Flask(__name__)

from auth import AuthError
@app.errorhandler(AuthError)
def handle_auth_error(e):
    return e.error, e.status_code

CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(tags_bp,  url_prefix="/api")

app.teardown_appcontext(close_db)
init_db(app)

@app.get("/api/health")
def health():
    return {"ok": True}, 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)


