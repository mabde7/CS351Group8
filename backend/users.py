# backend/users.py
import json
from flask import Blueprint, jsonify
from db import get_db
from auth import requires_auth, current_user, HANDLE_CLAIM

users_bp = Blueprint("users", __name__)


@users_bp.post("/register")
@requires_auth
def register_user():
    """DEPRECATED — Kept for compatibility. Use /api/me instead."""
    return auto_register_user()


def auto_register_user():
    """
    Ensure the current Auth0 user exists in the `users` table and that the
    JSON fields are always valid ('[]' for created_posts/bookmarks/recent_history).

    Returns the full row (never None if things succeed).
    """
    user = current_user() or {}
    sub = user.get("sub")
    handle = (
        user.get(HANDLE_CLAIM)
        or user.get("nickname")
        or user.get("username")
        or (user.get("email") or "").split("@")[0]
        or "User"
    )
    email = user.get("email") or ""

    if not sub:
        # Something is badly wrong with the token; let caller handle it
        return None

    db = get_db()

    # Single upsert: create the row if missing, update handle/email if it exists,
    # and make sure our JSON-ish text fields are never NULL.
    db.execute(
        """
        INSERT INTO users (sub, handle, email, created_posts, bookmarks, recent_history)
        VALUES (?, ?, ?, '[]', '[]', '[]')
        ON CONFLICT(sub) DO UPDATE
        SET handle = EXCLUDED.handle,
            email  = EXCLUDED.email,
            created_posts   = COALESCE(users.created_posts, '[]'),
            bookmarks       = COALESCE(users.bookmarks, '[]'),
            recent_history  = COALESCE(users.recent_history, '[]')
        """,
        (sub, handle, email),
    )
    db.commit()

    row = db.execute("SELECT * FROM users WHERE sub = ?", (sub,)).fetchone()
    return row



@users_bp.get("/me")
@requires_auth
def me():
    """Always auto-create the user entry on login and backfill created_posts."""
    row = auto_register_user()
    if row is None:
        return jsonify({"error": "User not found / could not be registered"}), 500
    return jsonify(dict(row))


def _fetch_posts_for_ids(db, ids):
    """
    Helper: given a list of postIDs, return full post objects with handle + tags.
    """
    if not ids:
        return []

    placeholders = ",".join("?" * len(ids))
    rows = db.execute(
        f"""
        SELECT
            p.postid      AS "postID",
            p.author_sub,
            p.title,
            p.text,
            p.links,
            p.images,
            p.created_at,
            u.handle
        FROM posts p
        JOIN users u ON p.author_sub = u.sub
        WHERE p.postid IN ({placeholders})
        ORDER BY p.created_at DESC
        """,
        ids,
    ).fetchall()

    posts = [dict(r) for r in rows]

    for p in posts:
        p["links"] = json.loads(p.get("links") or "[]")
        p["images"] = json.loads(p.get("images") or "[]")

        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postid = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]

    return posts


@users_bp.get("/me/posts")
@requires_auth
def me_posts():
    """
    Returns created posts and bookmarked posts for the current user:
      {
        "user": {... basic user info ...},
        "created": [post, ...],
        "bookmarks": [post, ...]
      }
    Uses auto_register_user so old posts are backfilled into created_posts.
    """
    row = auto_register_user()
    db = get_db()

    created_ids = json.loads(row["created_posts"] or "[]")
    bookmark_ids = json.loads(row["bookmarks"] or "[]")

    created_posts = _fetch_posts_for_ids(db, created_ids)
    bookmarked_posts = _fetch_posts_for_ids(db, bookmark_ids)

    return jsonify(
        {
            "user": {
                "sub": row["sub"],
                "handle": row["handle"],
                "email": row["email"],
            },
            "created": created_posts,
            "bookmarks": bookmarked_posts,
        }
    )


@users_bp.get("/profile/<handle>")
def profile(handle):
    """Public endpoint: fetch user and their posts by handle."""
    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE handle = ?", (handle,)
    ).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404

    posts = db.execute(
        """
        SELECT posts.*, users.handle
        FROM posts
        JOIN users ON posts.author_sub = users.sub
        WHERE users.handle = ?
        ORDER BY posts.created_at DESC
        """,
        (handle,),
    ).fetchall()

    return jsonify(
        {"user": dict(user), "posts": [dict(p) for p in posts]}
    )
