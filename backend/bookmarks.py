# backend/bookmarks.py
import json
from flask import Blueprint, request, jsonify
from db import get_db
from auth import requires_auth, current_user

bookmarks_bp = Blueprint("bookmarks", __name__)

def _load_user_and_bookmarks(db, sub):
  row = db.execute(
    "SELECT bookmarks FROM users WHERE sub = ?", (sub,)
  ).fetchone()
  if not row:
    return [], None
  bookmarks = json.loads(row["bookmarks"] or "[]")
  return bookmarks, row

@bookmarks_bp.post("/bookmarks")
@requires_auth
def add_bookmark():
  """
  Body:
    { "postID": 123 }
  Adds the given postID to the current user's bookmarks JSON list.
  """
  user = current_user()
  sub = user.get("sub")

  body = request.get_json(force=True) or {}
  post_id = body.get("postID")
  if not isinstance(post_id, int):
    return jsonify({"error": "postID (int) required"}), 400

  db = get_db()
  bookmarks, row = _load_user_and_bookmarks(db, sub)
  if row is None:
    return jsonify({"error": "User not found"}), 404

  if post_id not in bookmarks:
    bookmarks.append(post_id)
    db.execute(
      "UPDATE users SET bookmarks = ? WHERE sub = ?",
      (json.dumps(bookmarks), sub),
    )
    db.commit()

  return jsonify({"ok": True, "bookmarks": bookmarks}), 200


@bookmarks_bp.delete("/bookmarks/<int:post_id>")
@requires_auth
def remove_bookmark(post_id):
  """Removes a postID from the current user's bookmarks."""
  user = current_user()
  sub = user.get("sub")

  db = get_db()
  bookmarks, row = _load_user_and_bookmarks(db, sub)
  if row is None:
    return jsonify({"error": "User not found"}), 404

  if post_id in bookmarks:
    bookmarks.remove(post_id)
    db.execute(
      "UPDATE users SET bookmarks = ? WHERE sub = ?",
      (json.dumps(bookmarks), sub),
    )
    db.commit()

  return jsonify({"ok": True, "bookmarks": bookmarks}), 200


@bookmarks_bp.get("/bookmarks")
@requires_auth
def list_bookmarks():
  """
  Returns the current user's bookmarked posts with author handle + tags,
  similar structure to /api/posts.
  """
  user = current_user()
  sub = user.get("sub")

  db = get_db()
  bookmarks, row = _load_user_and_bookmarks(db, sub)
  if row is None:
    return jsonify({"error": "User not found"}), 404

  if not bookmarks:
    return jsonify([])

  placeholders = ",".join("?" * len(bookmarks))
  rows = db.execute(
    f"""
      SELECT p.*, u.handle
      FROM posts p
      JOIN users u ON p.author_sub = u.sub
      WHERE p.postID IN ({placeholders})
      ORDER BY p.created_at DESC
    """,
    bookmarks,
  ).fetchall()

  posts = [dict(r) for r in rows]

  # attach links/images/tags to match /posts endpoint
  for p in posts:
    p["links"] = json.loads(p["links"])
    p["images"] = json.loads(p["images"])
    trows = db.execute(
      "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
      (p["postID"],),
    ).fetchall()
    p["tags"] = [tr["tag"] for tr in trows]

  return jsonify(posts)
