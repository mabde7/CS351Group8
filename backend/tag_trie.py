# backend/tag_trie.py

from collections import defaultdict
from db import get_db


class TagNode:
    """
    Node in a tag trie. Each node represents one segment of a hierarchical tag.
    Example path: CS/CS315/Lab
    """
    def __init__(self, name: str = ""):
        self.name = name              # segment name, e.g. "CS315"
        self.children = {}            # segment -> TagNode
        self.is_tag = False           # True if this node corresponds to a full tag path


class TagTrie:
    """
    Trie for hierarchical tags like "CS/CS315/Lab".

    The DB still only stores flat tag strings (full paths like "CS/CS315/Lab").
    We interpret "/" as hierarchy when building the trie.
    """
    def __init__(self):
        self.root = TagNode()

    def clear(self):
        self.root = TagNode()

    def insert(self, tag_path: str) -> bool:
        """
        Insert a tag like "CS/CS315/Lab" into the trie.
        If there is no '/', it's just a top-level tag, e.g. "General".
        """
        tag_path = (tag_path or "").strip()
        if not tag_path:
            return False

        segments = [seg.strip() for seg in tag_path.split("/") if seg.strip()]
        if not segments:
            return False

        curr = self.root
        for seg in segments:
            if seg not in curr.children:
                curr.children[seg] = TagNode(seg)
            curr = curr.children[seg]
        curr.is_tag = True
        return True

    def _to_dict_recursive(self, node: TagNode):
        """
        Convert subtree rooted at `node` to a nested dict:
        {
          "CS": {
            "CS315": {
              "Lab": {},
              "Homework": {}
            }
          }
        }
        """
        out = {}
        for seg, child in sorted(node.children.items(), key=lambda kv: kv[0].lower()):
            out[seg] = self._to_dict_recursive(child)
        return out

    def to_nested_dict(self):
        """Return a nested dict representing the entire tag tree (excluding the root)."""
        return self._to_dict_recursive(self.root)

    def has_path(self, tag_path: str) -> bool:
        """Return True if a full tag path exists in the trie."""
        tag_path = (tag_path or "").strip()
        if not tag_path:
            return False

        segments = [seg.strip() for seg in tag_path.split("/") if seg.strip()]
        curr = self.root
        for seg in segments:
            if seg not in curr.children:
                return False
            curr = curr.children[seg]
        return curr.is_tag


# Single global trie instance used by the app
TAG_TRIE = TagTrie()


def rebuild_tag_trie_from_db():
    """
    Rebuild the global TAG_TRIE from the current contents of the tags table.
    Safe to call multiple times.
    """
    db = get_db()
    rows = db.execute("SELECT tag FROM tags").fetchall()

    TAG_TRIE.clear()
    for r in rows:
        TAG_TRIE.insert(r["tag"])
