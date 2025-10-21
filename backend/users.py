from flask import Blueprint, jsonify
from db import get_db
from auth import requires_auth, current_user, HANDLE_CLAIM

users_bp = Blueprint("users", __name__)

@users_bp.post("/register")
@requires_auth
def register_user():
    """Register or update user info from Auth0 login."""
    user = current_user()
    sub = user.get("sub")
    handle = user.get(HANDLE_CLAIM)
    email = user.get("email")

    db = get_db()
    existing = db.execute("SELECT sub FROM users WHERE sub = ?", (sub,)).fetchone()
    if not existing:
        db.execute(
            "INSERT INTO users (sub, handle, email) VALUES (?, ?, ?)",
            (sub, handle, email)
        )
    else:
        db.execute(
            "UPDATE users SET handle = ?, email = ? WHERE sub = ?",
            (handle, email, sub)
        )
    db.commit()
    return jsonify({"ok": True, "sub": sub, "handle": handle})

@users_bp.get("/me")
@requires_auth
def me():
    user = current_user()
    sub = user.get("sub")
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE sub = ?", (sub,)).fetchone()
    if not row:
        return jsonify({"error": "User not found"}), 404
    return jsonify(dict(row))

@users_bp.get("/profile/<handle>")
def profile(handle):
    """Public endpoint: fetch user and their posts by handle."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE handle = ?", (handle,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404

    posts = db.execute("""
        SELECT posts.*, users.handle
        FROM posts
        JOIN users ON posts.author_sub = users.sub
        WHERE users.handle = ?
        ORDER BY posts.created_at DESC
    """, (handle,)).fetchall()

    return jsonify({
        "user": dict(user),
        "posts": [dict(p) for p in posts]
    })
