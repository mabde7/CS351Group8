# backend/tags.py
from flask import Blueprint, jsonify
from db import get_db
from tag_trie import TAG_TRIE, rebuild_tag_trie_from_db

tags_bp = Blueprint("tags", __name__)


@tags_bp.get("/tags")
def list_tags():
    """
    Flat list of tags (full paths) in the system.
    Used by your Browse Topics page.
    """
    db = get_db()
    rows = db.execute("SELECT tag FROM tags ORDER BY tag ASC").fetchall()
    return jsonify([r["tag"] for r in rows]), 200


@tags_bp.get("/tags/tree")
def tags_tree():
    """
    Nested hierarchical view of tags based on the trie.
    Not required for TopicPage (since we infer subtags from posts),
    but available if you ever want it.
    """
    # Ensure trie is at least populated from DB once
    rebuild_tag_trie_from_db()
    tree = TAG_TRIE.to_nested_dict()
    return jsonify(tree), 200
