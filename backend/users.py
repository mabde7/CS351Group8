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
  Ensures the current Auth0 user exists in the database.
  Creates the user if missing.
  Returns the full user row.
  """
  user = current_user()
  sub = user.get("sub")
  handle = user.get(HANDLE_CLAIM)
  email = user.get("email")

  db = get_db()
  row = db.execute("SELECT * FROM users WHERE sub = ?", (sub,)).fetchone()

  if row is None:
    # Create new user
    db.execute(
      """
        INSERT INTO users (sub, handle, email, created_posts, bookmarks, recent_history)
        VALUES (?, ?, ?, '[]', '[]', '[]')
      """,
      (sub, handle, email),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE sub = ?", (sub,)).fetchone()
  else:
    # Update handle/email in case user changed it
    db.execute(
      """
        UPDATE users
        SET handle = ?, email = ?
        WHERE sub = ?
      """,
      (handle, email, sub),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE sub = ?", (sub,)).fetchone()

  return row


@users_bp.get("/me")
@requires_auth
def me():
  """Always auto-create the user entry on login."""
  row = auto_register_user()
  return jsonify(dict(row))


def _fetch_posts_for_ids(db, ids):
  if not ids:
    return []

  placeholders = ",".join("?" * len(ids))
  rows = db.execute(
    f"""
      SELECT p.*, u.handle
      FROM posts p
      JOIN users u ON p.author_sub = u.sub
      WHERE p.postID IN ({placeholders})
      ORDER BY p.created_at DESC
    """,
    ids,
  ).fetchall()

  posts = [dict(r) for r in rows]

  for p in posts:
    p["links"] = json.loads(p["links"])
    p["images"] = json.loads(p["images"])
    trows = db.execute(
      "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
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

  return jsonify({"user": dict(user), "posts": [dict(p) for p in posts]})
