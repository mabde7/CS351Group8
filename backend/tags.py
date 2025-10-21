# backend/tags.py
from flask import Blueprint, jsonify
from db import get_db

tags_bp = Blueprint("tags", __name__)

@tags_bp.get("/tags")
def list_tags():
    """
    Returns: [{ "tag": "CS377", "count": 12 }, ...]
    """
    db = get_db()
    rows = db.execute(
        """
        SELECT t.tag, COUNT(pt.postID) AS count
        FROM tags t
        LEFT JOIN post_tags pt ON pt.tag = t.tag
        GROUP BY t.tag
        ORDER BY count DESC, t.tag ASC
        """
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@tags_bp.get("/tags/<tag>/posts")
def posts_for_tag(tag):
    """
    Shortcut endpoint to fetch posts for a specific tag.
    Same shape as GET /api/posts?tag=...
    """
    db = get_db()
    rows = db.execute(
        """
        SELECT p.*, u.handle
        FROM posts p
        JOIN users u ON p.author_sub = u.sub
        JOIN post_tags pt ON pt.postID = p.postID
        WHERE pt.tag = ?
        ORDER BY p.created_at DESC
        """,
        (tag,),
    ).fetchall()

    posts = [dict(r) for r in rows]
    for p in posts:
        import json
        p["links"]  = json.loads(p["links"])
        p["images"] = json.loads(p["images"])
        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]
    return jsonify(posts)

