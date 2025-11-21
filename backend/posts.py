# backend/posts.py
from flask import Blueprint, jsonify, request
import json
from db import get_db
from auth import requires_auth, current_user
from users import auto_register_user  # ensure user row exists & backfilled

posts_bp = Blueprint("posts", __name__)


def remove_post_from_user_lists(db, user_sub, post_id):
    """
    Removes post_id from created_posts and bookmarks ONLY.
    recent_history contains TAGS, not posts — so we do NOT touch it here.
    """
    row = db.execute(
        "SELECT created_posts, bookmarks FROM users WHERE sub = ?",
        (user_sub,),
    ).fetchone()

    if not row:
        return

    created = json.loads(row["created_posts"] or "[]")
    bookmarks = json.loads(row["bookmarks"] or "[]")

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
      "tags": ["CS/CS377/Lab", ...] // optional, supports hierarchical tags
    }

    - Ensures the user row exists (auto_register_user).
    - Inserts the post.
    - Updates user's created_posts JSON.
    - Expands hierarchical tags:
        "CS/CS377/Lab" => "CS", "CS/CS377", "CS/CS377/Lab"
      and associates all prefixes with the post in post_tags.
    """
    # Make sure user row exists and is backfilled
    row = auto_register_user()
    sub = row["sub"]

    body = request.get_json(force=True) or {}
    title = (body.get("title") or "Untitled").strip()
    text = (body.get("text") or "").strip()  # HTML
    links = json.dumps(body.get("links", []))
    images = json.dumps(body.get("images", []))

    # Tags can be hierarchical, like "CS/CS315/Lab"
    raw_tags = [t.strip() for t in body.get("tags", []) if t and t.strip()]

    if not text:
        return jsonify({"error": "Post text required"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO posts (author_sub, title, text, links, images) VALUES (?,?,?,?,?)",
        (sub, title, text, links, images),
    )
    post_id = cur.lastrowid

    # Update user's created_posts JSON array
    created = json.loads(row["created_posts"] or "[]")
    if post_id not in created:
        created.append(post_id)
        db.execute(
            "UPDATE users SET created_posts = ? WHERE sub = ?",
            (json.dumps(created), sub),
        )

    # upsert tags + junction rows, expanding hierarchical paths
    # Example:
    #   "CS/CS315/Lab" -> "CS", "CS/CS315", "CS/CS315/Lab"
    for tag_str in raw_tags:
        parts = [p.strip() for p in tag_str.split("/") if p.strip()]
        if not parts:
            continue

        prefix = []
        for part in parts:
            prefix.append(part)
            full_path = "/".join(prefix)

            # Ensure tag exists in tags table
            db.execute("INSERT OR IGNORE INTO tags (tag) VALUES (?)", (full_path,))

            # Associate ALL levels with this post so parent tags show posts of subtags
            db.execute(
                "INSERT OR IGNORE INTO post_tags (postID, tag) VALUES (?, ?)",
                (post_id, full_path),
            )

    db.commit()

    return jsonify(
        {"postID": post_id, "title": title, "text": text, "tags": raw_tags}
    ), 201


@posts_bp.get("/posts")
def list_posts():
    """
    Optional query param: ?tag=CS or ?tag=CS/CS315 or ?tag=CS/CS315/Lab
    Because we store all hierarchical levels in post_tags, a filter on "CS"
    will return posts tagged "CS" and any deeper path where "CS" is the root.
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
        p["links"] = json.loads(p["links"])
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
    - Only the post's author may delete it.
    - Removes postID from user's created_posts and bookmarks lists.
    - Deletes the post; post_tags rows removed automatically via CASCADE.
    """
    user = current_user()
    sub = user.get("sub")  # Auth0 user ID

    db = get_db()

    # Check post ownership
    post = db.execute(
        "SELECT author_sub FROM posts WHERE postID = ?",
        (post_id,),
    ).fetchone()

    if not post:
        return jsonify({"error": "Post not found"}), 404

    if post["author_sub"] != sub:
        return jsonify({"error": "Not authorized to delete this post"}), 403

    # Clean up user's JSON lists
    remove_post_from_user_lists(db, sub, post_id)

    # Delete the post
    db.execute("DELETE FROM posts WHERE postID = ?", (post_id,))
    db.commit()

    return jsonify({"deleted": post_id}), 200


# -------------------------------------------------------------------
# Bulk fetch posts by IDs (for user page)
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
