# backend/app.py
from dotenv import load_dotenv
load_dotenv()  # load .env BEFORE any imports that read env

from flask import Flask
from flask_cors import CORS
from db import init_db, close_db
from posts import posts_bp
from users import users_bp
from tags import tags_bp
from auth import AuthError
from recent import recent_bp



app = Flask(__name__)

# Allow React (3000) to call any /api/* endpoint and send Authorization
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:3000"]}},
    supports_credentials=False
)

# Ensure CORS headers are present even on errors
@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    return resp

# Error handler still works, now with CORS headers
@app.errorhandler(AuthError)
def handle_auth_error(e):
    return e.error, e.status_code

app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(tags_bp,  url_prefix="/api")
app.register_blueprint(recent_bp)  


app.teardown_appcontext(close_db)
init_db(app)

@app.get("/api/health")
def health():
    return {"ok": True}, 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)
