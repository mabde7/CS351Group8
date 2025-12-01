# backend/recent.py
from flask import Blueprint, request, jsonify
import time
from typing import Dict
import json
from db import get_db
from cuckoo_map import CuckooHashMap  # <- NEW: advanced hashing structure

recent_bp = Blueprint("recent", __name__)

_RECENT_MAX = 10


class _PerUserRecents:
    """
    Holds a per-user CuckooHashMap (tag -> last-visited timestamp).

    We keep at most _RECENT_MAX entries per user. Recents are returned
    most-recent-first by sorting on the stored timestamps.
    """

    def __init__(self):
        # Advanced hashing: CuckooHashMap instead of SkipList
        self.map = CuckooHashMap()  # tag -> ts (time_ns)

    def put(self, tag: str):
        if not tag:
            return

        ts = time.time_ns()
        # Insert or update timestamp for this tag
        self.map[tag] = ts

        # Trim to at most _RECENT_MAX entries
        while len(self.map) > _RECENT_MAX:
            # find oldest by timestamp; n <= 11 so O(n) is fine
            oldest_tag, _ = min(self.map.items(), key=lambda kv: kv[1])
            del self.map[oldest_tag]

    def list(self):
        # Return tags sorted by timestamp descending (most recent first)
        sorted_items = sorted(self.map.items(), key=lambda kv: kv[1], reverse=True)
        return [tag for tag, _ in sorted_items]


# In-memory: userKey -> _PerUserRecents
_USERS: Dict[str, _PerUserRecents] = {}


def _get_bucket(user_key: str) -> _PerUserRecents:
    bucket = _USERS.get(user_key)
    if bucket is None:
        bucket = _PerUserRecents()
        _USERS[user_key] = bucket
    return bucket


@recent_bp.get("/recent-topics")
def recent_list():
    user_key = (request.args.get("user") or "").strip()
    if not user_key:
        return jsonify({"ok": False, "error": "Missing user"}), 400
    bucket = _get_bucket(user_key)
    return jsonify({"ok": True, "topics": bucket.list()}), 200


@recent_bp.post("/recent-topics")
def recent_add():
    data = request.get_json(silent=True) or {}
    user_key = (data.get("user") or "").strip()
    tag = (data.get("tag") or "").strip()
    if not user_key or not tag:
        return jsonify({"ok": False, "error": "Missing user or tag"}), 400
    bucket = _get_bucket(user_key)
    bucket.put(tag)
    return jsonify({"ok": True, "topics": bucket.list()}), 200


@recent_bp.post("/recent-topics/save")
def save_recents():
    data = request.get_json(silent=True) or {}
    user_key = (data.get("user") or "").strip()

    if not user_key:
        return jsonify({"ok": False, "error": "Missing user"}), 400

    bucket = _get_bucket(user_key)
    topics = bucket.list()

    db = get_db()
    db.execute(
        "UPDATE users SET recent_history = ? WHERE sub = ?",
        (json.dumps(topics), user_key),
    )
    db.commit()

    return jsonify({"ok": True, "saved": topics})
