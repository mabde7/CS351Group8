# backend/posts.py
from flask import Blueprint, jsonify, request, abort
import json
from db import get_db
from auth import requires_auth, current_user
from users import auto_register_user  # to ensure user row exists

posts_bp = Blueprint("posts", __name__)


def remove_post_from_user_lists(db, user_sub, post_id):
    """
    Removes post_id from created_posts and bookmarks ONLY.
    recent_history contains TAGS, not posts — so we do NOT modify it here.
    """
    row = db.execute(
        "SELECT created_posts, bookmarks FROM users WHERE sub = ?",
        (user_sub,),
    ).fetchone()

    if not row:
        return

    created = json.loads(row["created_posts"])
    bookmarks = json.loads(row["bookmarks"])

    changed = False

    if post_id in created:
        created.remove(post_id)
        changed = True

    if post_id in bookmarks:
        bookmarks.remove(post_id)
        changed = True

    if changed:
        db.execute(
            """
            UPDATE users
            SET created_posts = ?, bookmarks = ?
            WHERE sub = ?
            """,
            (json.dumps(created), json.dumps(bookmarks), user_sub),
        )


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

    # Update user's created_posts
    row = db.execute("SELECT created_posts FROM users WHERE sub = ?", (sub,)).fetchone()
    created = json.loads(row["created_posts"]) if row else []
    created.append(post_id)
    db.execute(
        "UPDATE users SET created_posts = ? WHERE sub = ?",
        (json.dumps(created), sub),
    )

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

    # attach tags, links, images for each post
    for p in posts:
        p["links"]  = json.loads(p["links"])
        p["images"] = json.loads(p["images"])
        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]

    return jsonify(posts)


@posts_bp.delete("/posts/<int:post_id>")
@requires_auth
def delete_post(post_id):
    """
    Delete a post:
    - Only the post's author may delete it
    - Removes postID from user's JSON lists
    - Deletes the post; post_tags rows removed automatically via CASCADE
    """
    user = current_user()
    sub = user.get("sub")   # Auth0 user ID

    db = get_db()

    # 1. Fetch the post to check if it exists and belongs to the current user
    post = db.execute(
        "SELECT author_sub FROM posts WHERE postID = ?",
        (post_id,),
    ).fetchone()

    if not post:
        return jsonify({"error": "Post not found"}), 404

    if post["author_sub"] != sub:
        return jsonify({"error": "Not authorized to delete this post"}), 403

    # 2. Clean up user's data (bookmarks, created_posts, history)
    remove_post_from_user_lists(db, sub, post_id)

    # 3. Actually delete the post
    db.execute(
        "DELETE FROM posts WHERE postID = ?",
        (post_id,),
    )

    db.commit()

    return jsonify({"deleted": post_id}), 200


# -------------------------------------------------------------------
# NEW: bulk fetch posts by IDs (for user page)
# GET /api/posts/by_ids?ids=1,2,3
# -------------------------------------------------------------------
@posts_bp.get("/posts/by_ids")
def posts_by_ids():
    ids_param = (request.args.get("ids") or "").strip()
    if not ids_param:
        return jsonify([])

    try:
        raw_ids = [int(x) for x in ids_param.split(",") if x.strip()]
    except ValueError:
        return jsonify({"error": "Invalid ids parameter"}), 400

    # dedupe
    ids = list(dict.fromkeys(raw_ids))
    if not ids:
        return jsonify([])

    db = get_db()
    placeholders = ",".join("?" for _ in ids)

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

    return jsonify(posts)


# -------------------------------------------------------------------
# NEW: bookmark endpoints
#   POST   /api/bookmarks/<post_id>   -> add bookmark
#   DELETE /api/bookmarks/<post_id>   -> remove bookmark
#   GET    /api/bookmarks             -> get user's bookmarked posts
# -------------------------------------------------------------------
@posts_bp.post("/bookmarks/<int:post_id>")
@requires_auth
def add_bookmark(post_id):
    """
    Add a post to the current user's bookmarks list (JSON array of IDs).
    """
    # ensure user exists and get row
    row = auto_register_user()
    sub = row["sub"]
    db = get_db()

    # ensure post exists
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

    return jsonify({"bookmarked": True, "postID": post_id})


@posts_bp.delete("/bookmarks/<int:post_id>")
@requires_auth
def remove_bookmark(post_id):
    """
    Remove a post from the current user's bookmarks list.
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

    return jsonify({"bookmarked": False, "postID": post_id})


@posts_bp.get("/bookmarks")
@requires_auth
def list_bookmarks():
    """
    Return the current user's bookmarks:
    {
      "ids": [1,2,3],
      "posts": [ {post}, ... ]   # with handle, tags, links, images
    }
    """
    row = auto_register_user()
    db = get_db()

    bookmark_ids = json.loads(row["bookmarks"] or "[]")
    if not bookmark_ids:
        return jsonify({"ids": [], "posts": []})

    placeholders = ",".join("?" for _ in bookmark_ids)

    rows = db.execute(
        f"""
        SELECT p.*, u.handle
        FROM posts p
        JOIN users u ON p.author_sub = u.sub
        WHERE p.postID IN ({placeholders})
        ORDER BY p.created_at DESC
        """,
        bookmark_ids,
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

    return jsonify({"ids": bookmark_ids, "posts": posts})
