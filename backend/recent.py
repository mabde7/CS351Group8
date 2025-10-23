# backend/recent.py
from flask import Blueprint, request, jsonify
import time
from typing import Dict
from skiplist import SkipList  # ensure your SkipList is importable as backend/skiplist.py

recent_bp = Blueprint("recent", __name__)

_RECENT_MAX = 10

class _PerUserRecents:
    """Holds a per-user skiplist (most-recent-first) + map for quick delete."""
    def __init__(self):
        # key for skiplist ordering is (-ts, tag) so smaller (more negative) ts sorts to front
        self.map = {}  # tag -> ts
        self.sl = SkipList(key_func=lambda item: (-item["ts"], item["tag"]))

    def put(self, tag: str):
        # remove existing
        if tag in self.map:
            old_ts = self.map[tag]
            self.sl.delete((-old_ts, tag))
        # insert as most recent
        ts = time.time_ns()
        self.map[tag] = ts
        self.sl.insert({"tag": tag, "ts": ts})
        # trim if needed
        while len(self.map) > _RECENT_MAX:
            # remove the oldest by ts (n <= 11, so O(n) is fine)
            oldest = min(self.map, key=lambda t: self.map[t])
            old_ts = self.map.pop(oldest)
            self.sl.delete((-old_ts, oldest))

    def list(self):
        return [v["tag"] for _, v in self.sl.iter_items()]

# In-memory: userKey -> _PerUserRecents
_USERS: Dict[str, _PerUserRecents] = {}

def _get_bucket(user_key: str) -> _PerUserRecents:
    bucket = _USERS.get(user_key)
    if bucket is None:
        bucket = _PerUserRecents()
        _USERS[user_key] = bucket
    return bucket

@recent_bp.get("/api/recent-topics")
def recent_list():
    user_key = (request.args.get("user") or "").strip()
    if not user_key:
        return jsonify({"ok": False, "error": "Missing user"}), 400
    bucket = _get_bucket(user_key)
    return jsonify({"ok": True, "topics": bucket.list()}), 200

@recent_bp.post("/api/recent-topics")
def recent_add():
    data = request.get_json(silent=True) or {}
    user_key = (data.get("user") or "").strip()
    tag = (data.get("tag") or "").strip()
    if not user_key or not tag:
        return jsonify({"ok": False, "error": "Missing user or tag"}), 400
    bucket = _get_bucket(user_key)
    bucket.put(tag)
    return jsonify({"ok": True, "topics": bucket.list()}), 200
