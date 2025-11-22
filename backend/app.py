# backend/app.py
from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_cors import CORS
from db import init_db, close_db
from posts import posts_bp
from users import users_bp
from tags import tags_bp   
from auth import AuthError
from recent import recent_bp
from bookmarks import bookmarks_bp

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:3000"]}},
    supports_credentials=False,
)

@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    return resp

@app.errorhandler(AuthError)
def handle_auth_error(e):
    return e.error, e.status_code

app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(tags_bp,  url_prefix="/api")
app.register_blueprint(recent_bp, url_prefix="/api")
app.register_blueprint(bookmarks_bp, url_prefix="/api")

app.teardown_appcontext(close_db)
init_db(app)



@app.get("/api/health")
def health():
    return {"ok": True}, 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)
