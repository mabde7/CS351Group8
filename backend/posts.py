# backend/posts.py
from flask import Blueprint, jsonify, request
import json

from db import get_db
from auth import requires_auth, current_user
from users import auto_register_user
from tag_trie import TAG_TRIE

posts_bp = Blueprint("posts", __name__)


def _attach_tags_links_images(db, post_rows):
    """Helper to attach tags, links, images to post dicts."""
    posts = [dict(r) for r in post_rows]

    for p in posts:
        # decode JSON columns
        p["links"] = json.loads(p.get("links") or "[]")
        p["images"] = json.loads(p.get("images") or "[]")

        # attach tags from post_tags
        trows = db.execute(
            "SELECT tag FROM post_tags WHERE postID = ? ORDER BY tag ASC",
            (p["postID"],),
        ).fetchall()
        p["tags"] = [tr["tag"] for tr in trows]

    return posts


@posts_bp.post("/posts")
@requires_auth
def create_post():
    """
    Create a post.

    Body JSON:
    {
      "title": "string",
      "text": "<p>HTML from React-Quill</p>",
      "links": ["http://..."],       // optional
      "images": ["http://..."],      // optional
      "tags": ["CS", "CS/CS315/Lab"] // optional, full paths only
    }

    We **only** store full tag paths in the DB (tags + post_tags).
    Parent/child relationships are inferred in the trie and via prefix queries.
    """
    # Ensure the user row exists and get it
    user_row = auto_register_user()
    sub = user_row["sub"]

    body = request.get_json(silent=True) or {}

    title = (body.get("title") or "Untitled").strip()
    text = (body.get("text") or "").strip()
    links = json.dumps(body.get("links", []))
    images = json.dumps(body.get("images", []))

    raw_tags = body.get("tags") or []
    tags = []
    for t in raw_tags:
        t = (t or "").strip()
        if t:
            tags.append(t)

    if not text:
        return jsonify({"error": "Post text required"}), 400

    db = get_db()

    # INSERT for Postgres: use RETURNING to get the new postid
    row = db.execute(
        """
        INSERT INTO posts (author_sub, title, text, links, images)
        VALUES (?, ?, ?, ?, ?)
        RETURNING postid
        """,
        (sub, title, text, links, images),
    ).fetchone()
    post_id = row["postid"]

    # Update user's created_posts list
    created = json.loads(user_row["created_posts"] or "[]")
    created.append(post_id)
    db.execute(
        "UPDATE users SET created_posts = ? WHERE sub = ?",
        (json.dumps(created), sub),
    )

    # Insert tags and junction rows (full paths only)
    for tag in tags:
        # DB record of the full path
        db.execute(
            "INSERT INTO tags (tag) VALUES (?) ON CONFLICT(tag) DO NOTHING",
            (tag,),
        )
        db.execute(
            """
            INSERT INTO post_tags (postID, tag)
            VALUES (?, ?)
            ON CONFLICT (postID, tag) DO NOTHING
            """,
            (post_id, tag),
        )
        # Also record in trie (backend data structure requirement)
        TAG_TRIE.insert(tag)

    db.commit()

    return (
        jsonify(
            {
                "postID": post_id,
                "title": title,
                "text": text,
                "tags": tags,
            }
        ),
        201,
    )


@posts_bp.get("/posts")
def list_posts():
    """
    List posts, optionally filtered by a hierarchical tag.

    Query param:
      ?tag=CS
        → returns posts whose tags are "CS" **or** start with "CS/"

      ?tag=CS/CS315
        → returns posts whose tags are "CS/CS315" **or** start with "CS/CS315/"
    """
    tag_filter = (request.args.get("tag") or "").strip()
    db = get_db()

    if tag_filter:
        # Find all full tags that match this path as prefix
        trows = db.execute(
            """
            SELECT tag
            FROM tags
            WHERE tag = ?
               OR tag LIKE ?
            """,
            (tag_filter, f"{tag_filter}/%"),
        ).fetchall()

        full_tags = [tr["tag"] for tr in trows] or [tag_filter]

        placeholders = ",".join("?" for _ in full_tags)
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
            JOIN users u   ON p.author_sub = u.sub
            JOIN post_tags pt ON pt.postID = p.postid
            WHERE pt.tag IN ({placeholders})
            ORDER BY p.created_at DESC
            """,
            full_tags,
        ).fetchall()
    else:
        rows = db.execute(
            """
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
            ORDER BY p.created_at DESC
            """
        ).fetchall()

    posts = _attach_tags_links_images(db, rows)
    return jsonify(posts), 200


@posts_bp.delete("/posts/<int:post_id>")
@requires_auth
def delete_post(post_id):
    """
    Delete a post:
      - Only author may delete
      - Removes postID from user's created_posts and bookmarks
      - post_tags rows are handled by FK ON DELETE CASCADE
    """
    user = current_user()
    sub = user.get("sub")

    db = get_db()

    post = db.execute(
        "SELECT author_sub FROM posts WHERE postid = ?",
        (post_id,),
    ).fetchone()

    if not post:
        return jsonify({"error": "Post not found"}), 404

    if post["author_sub"] != sub:
        return jsonify({"error": "Not authorized"}), 403

    # Update created_posts and bookmarks
    row = db.execute(
        "SELECT created_posts, bookmarks FROM users WHERE sub = ?",
        (sub,),
    ).fetchone()
    if row:
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
                (json.dumps(created), json.dumps(bookmarks), sub),
            )

    # Delete post
    db.execute("DELETE FROM posts WHERE postid = ?", (post_id,))
    db.commit()

    return jsonify({"deleted": post_id}), 200


@posts_bp.get("/posts/by_ids")
def posts_by_ids():
    """
    Bulk fetch posts by IDs.
    GET /api/posts/by_ids?ids=1,2,3
    """
    ids_raw = (request.args.get("ids") or "").strip()
    if not ids_raw:
        return jsonify([]), 200

    try:
        raw_ids = [int(x) for x in ids_raw.split(",") if x.strip()]
    except ValueError:
        return jsonify({"error": "Invalid ids parameter"}), 400

    # dedupe while preserving order
    seen = set()
    ids = []
    for i in raw_ids:
        if i not in seen:
            seen.add(i)
            ids.append(i)

    if not ids:
        return jsonify([]), 200

    db = get_db()
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

    posts = _attach_tags_links_images(db, rows)
    return jsonify(posts), 200
