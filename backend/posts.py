# backend/posts.py
from flask import Blueprint, jsonify, request
import json
from db import get_db
from auth import requires_auth, current_user

posts_bp = Blueprint("posts", __name__)

@posts_bp.post("/posts")
@requires_auth
def create_post():
    """
    Body (JSON) from frontend:
    {
      "title": "string",
      "text": "<p>HTML from React-Quill</p>",
      "links": ["http://..."],      // optional
      "images": ["http://..."],     // optional
      "tags": ["CS377","Algorithms"]// optional
    }
    """
    user = current_user()
    sub = user.get("sub")

    body = request.get_json(force=True) or {}
    title  = (body.get("title") or "Untitled").strip()
    text   = (body.get("text")  or "").strip()          # HTML
    links  = json.dumps(body.get("links", []))
    images = json.dumps(body.get("images", []))
    tags   = [t.strip() for t in body.get("tags", []) if t and t.strip()]

    if not text:
        return jsonify({"error": "Post text required"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO posts (author_sub, title, text, links, images) VALUES (?,?,?,?,?)",
        (sub, title, text, links, images),
    )
    post_id = cur.lastrowid

    # upsert tags + junction rows
    for tag in tags:
        db.execute("INSERT OR IGNORE INTO tags (tag) VALUES (?)", (tag,))
        db.execute(
            "INSERT OR IGNORE INTO post_tags (postID, tag) VALUES (?,?)",
            (post_id, tag),
        )

    db.commit()

    # return the created post (minimal)
    return jsonify({"postID": post_id, "title": title, "text": text, "tags": tags}), 201


@posts_bp.get("/posts")
def list_posts():
    """
    Optional query param: ?tag=CS377
    Returns posts with latest user handle and tag list.
    """
    tag_filter = request.args.get("tag")
    db = get_db()

    if tag_filter:
        rows = db.execute(
            """
            SELECT p.*, u.handle
            FROM posts p
            JOIN users u ON p.author_sub = u.sub
            JOIN post_tags pt ON pt.postID = p.postID
            WHERE pt.tag = ?
            ORDER BY p.created_at DESC
            """,
            (tag_filter,),
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT p.*, u.handle
            FROM posts p
            JOIN users u ON p.author_sub = u.sub
            ORDER BY p.created_at DESC
            """
        ).fetchall()

    posts = [dict(r) for r in rows]

    # attach tags for each post
    for p in posts:
        p["links"]  = json.loads(p["links"])
        p["images"] = json.loads(p["images"])
        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]

    return jsonify(posts)
