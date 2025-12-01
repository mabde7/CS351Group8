# backend/recent.py
from flask import Blueprint, request, jsonify
import time
from typing import Dict
import json
from db import get_db
from cuckoo_map import CuckooHashMap  # advanced hashing structure
# no circular import: do NOT import users here

recent_bp = Blueprint("recent", __name__)

_RECENT_MAX = 10


class _PerUserRecents:
    """
    Holds a per-user CuckooHashMap (tag -> last-visited timestamp).

    We keep at most _RECENT_MAX entries per user. Recents are returned
    most-recent-first by sorting on the stored timestamps.
    """

    def __init__(self):
        self.map = CuckooHashMap()  # tag -> ts (time_ns)

    def put(self, tag: str):
        if not tag:
            return

        ts = time.time_ns()
        self.map[tag] = ts

        # Trim to at most _RECENT_MAX entries
        while len(self.map) > _RECENT_MAX:
            oldest_tag, _ = min(self.map.items(), key=lambda kv: kv[1])
            del self.map[oldest_tag]

    def list(self):
        sorted_items = sorted(self.map.items(), key=lambda kv: kv[1], reverse=True)
        return [tag for tag, _ in sorted_items]


# In-memory: userKey -> _PerUserRecents
_USERS: Dict[str, _PerUserRecents] = {}


def _hydrate_from_db(user_key: str, bucket: _PerUserRecents) -> None:
    """
    On first use for an Auth0 user, seed the in-memory recents
    from the users.recent_history column if it exists.
    """
    # Only try for real Auth0 users; guests never hit the users table
    if not user_key.startswith("auth0|"):
        return

    db = get_db()
    row = db.execute(
        "SELECT recent_history FROM users WHERE sub = ?",
        (user_key,),
    ).fetchone()

    if not row:
        return

    raw = row["recent_history"]
    if not raw:
        return

    try:
        topics = json.loads(raw)
    except json.JSONDecodeError:
        return

    # Assign decreasing timestamps so leftmost is "most recent"
    base_ts = time.time_ns()
    for idx, tag in enumerate(topics):
        if not tag:
            continue
        bucket.map[tag] = base_ts - idx


def _get_bucket(user_key: str) -> _PerUserRecents:
    bucket = _USERS.get(user_key)
    if bucket is None:
        bucket = _PerUserRecents()
        _USERS[user_key] = bucket
        _hydrate_from_db(user_key, bucket)
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

    # Only persist for real logged-in users
    if not user_key.startswith("auth0|"):
        return jsonify({"ok": True, "saved": topics}), 200

    db = get_db()
    db.execute(
        """
        INSERT INTO users (sub, recent_history)
        VALUES (?, ?)
        ON CONFLICT(sub) DO UPDATE
        SET recent_history = excluded.recent_history
        """,
        (user_key, json.dumps(topics)),
    )
    db.commit()

    return jsonify({"ok": True, "saved": topics}), 200
