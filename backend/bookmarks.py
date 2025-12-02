import json
from flask import Blueprint, jsonify
from db import get_db
from auth import requires_auth
from users import auto_register_user

bookmarks_bp = Blueprint("bookmarks", __name__)


def _fetch_posts_for_ids(db, ids):
    """
    Given a list of postIDs, return full post objects with handle + tags.
    Works with the Postgres schema:
      posts(postid, author_sub, title, text, links, images, created_at)
    """
    if not ids:
        return []

    placeholders = ",".join("?" for _ in ids)
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
        # links/images are stored as JSON in TEXT columns
        p["links"] = json.loads(p.get("links") or "[]")
        p["images"] = json.loads(p.get("images") or "[]")

        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postid = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]

    return posts


@bookmarks_bp.get("/bookmarks")
@requires_auth
def list_bookmarks():
    """
    Return the current user's bookmarks:

      { "ids": [1,2,3], "posts": [ {post}, ... ] }
    """
    row = auto_register_user()  # guarantees row exists + JSON fields initialized
    db = get_db()

    bookmark_ids = json.loads(row["bookmarks"] or "[]")
    posts = _fetch_posts_for_ids(db, bookmark_ids)

    return jsonify({"ids": bookmark_ids, "posts": posts}), 200


@bookmarks_bp.post("/bookmarks/<int:post_id>")
@requires_auth
def add_bookmark(post_id):
    """
    Add a postID to the current user's bookmarks list.
    """
    row = auto_register_user()
    sub = row["sub"]
    db = get_db()

    # ensure post exists
    exists = db.execute(
        "SELECT 1 FROM posts WHERE postid = ?",
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

    return jsonify({"bookmarked": True, "postID": post_id}), 200


@bookmarks_bp.delete("/bookmarks/<int:post_id>")
@requires_auth
def remove_bookmark(post_id):
    """
    Remove a postID from the current user's bookmarks list.
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

    return jsonify({"bookmarked": False, "postID": post_id}), 200
