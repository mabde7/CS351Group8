# backend/bookmarks.py
import json
from flask import Blueprint, request, jsonify
from db import get_db
from auth import requires_auth, current_user
from users import auto_register_user  # ensure user row exists

bookmarks_bp = Blueprint("bookmarks", __name__)


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


@bookmarks_bp.post("/bookmarks")
@requires_auth
def add_bookmark():
    """
    STYLE A

    POST /api/bookmarks
    Body:
      { "postID": 123 }

    Adds the given postID to the current user's bookmarks JSON list.
    """
    # Ensure user row exists
    row = auto_register_user()
    sub = row["sub"]

    body = request.get_json(force=True) or {}
    post_id = body.get("postID")
    if not isinstance(post_id, int):
        return jsonify({"error": "postID (int) required"}), 400

    db = get_db()

    # Ensure the post exists
    exists = db.execute(
        "SELECT 1 FROM posts WHERE postID = ?",
        (post_id,),
    ).fetchone()
    if not exists:
        return jsonify({"error": "Post not found"}), 404

    bookmarks = json.loads(row["bookmarks"] or "[]")
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
    """
    STYLE A

    DELETE /api/bookmarks/<post_id>
    Removes a postID from the current user's bookmarks.
    """
    row = auto_register_user()
    sub = row["sub"]
    db = get_db()

    bookmarks = json.loads(row["bookmarks"] or "[]")
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
    STYLE A

    GET /api/bookmarks

    Returns the current user's bookmarked posts as a list:
      [ {post}, ... ]
    matching the structure of /api/posts (includes handle, tags, links, images).
    """
    row = auto_register_user()
    db = get_db()

    bookmark_ids = json.loads(row["bookmarks"] or "[]")
    if not bookmark_ids:
        return jsonify([])

    posts = _fetch_posts_for_ids(db, bookmark_ids)
    return jsonify(posts)
