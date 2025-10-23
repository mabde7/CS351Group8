import random
from typing import Callable, Optional, Any

class Node:
    """A single node in the skip list."""
    __slots__ = ("key", "value", "forward")
    def __init__(self, key, value=None, level=0):
        self.key = key
        self.value = value
        self.forward = [None] * (level + 1)  # pointers for each level


class SkipList:
    """
    Skip list with flexible ordering.
    - Pass key_func(value) -> comparable key to choose how values are ordered.
    - Keys must be totally ordered (e.g., numbers, strings, tuples).
    - By default, duplicate keys overwrite; set allow_duplicates=True to store multiple.
    """
    def __init__(self, max_level: int = 16, p: float = 0.5,
                 key_func: Callable[[Any], Any] = lambda v: v,
                 allow_duplicates: bool = False):
        self.max_level = max_level
        self.p = p
        self.key_func = key_func
        self.allow_duplicates = allow_duplicates

        self.header = self._create_node(self.max_level, float('-inf'))
        self.level = 0
        self.size = 0

    # ---------- internals ----------
    def _create_node(self, level: int, key, value=None) -> Node:
        return Node(key, value, level)

    def _random_level(self) -> int:
        lvl = 0
        # Levels are 0..max_level; reserve header at max_level; nodes up to max_level-1 is common
        while random.random() < self.p and lvl < self.max_level:
            lvl += 1
        return lvl

    def _locate_updates(self, key):
        """
        Walk down levels to find predecessors at each level for the given key.
        Returns (current, update[]) where current is the rightmost node < key at level 0
        and update[i] is the predecessor at level i.
        """
        update = [None] * (self.max_level + 1)
        x = self.header
        for i in range(self.level, -1, -1):
            while x.forward[i] and x.forward[i].key < key:
                x = x.forward[i]
            update[i] = x
        return x, update

    # ---------- public API ----------
    def search(self, key) -> Optional[Any]:
        """
        Search by key. Returns stored value if found, else None.
        (If you want to search by a value's field, compute the same key and pass it here.)
        """
        x, _ = self._locate_updates(key)
        x = x.forward[0]
        if x and x.key == key:
            # If duplicates allowed, return the first match; user can iterate with iter_from(key)
            return x.value
        return None

    def get(self, value) -> Optional[Any]:
        """
        Convenience: compute key from value via key_func and search for it.
        Useful if your natural handle is the object itself.
        """
        return self.search(self.key_func(value))

    def insert(self, value) -> Optional[Any]:
        """
        Insert a value object according to key_func(value).
        - If duplicates are disabled and key exists, replaces value and returns the old value.
        - If duplicates enabled, inserts another node with same key and returns None.
        """
        key = self.key_func(value)
        _, update = self._locate_updates(key)
        nxt = update[0].forward[0]

        if not self.allow_duplicates and nxt and nxt.key == key:
            old = nxt.value
            nxt.value = value
            return old

        lvl = self._random_level()
        if lvl > self.level:
            for i in range(self.level + 1, lvl + 1):
                update[i] = self.header
            self.level = lvl

        new_node = self._create_node(lvl, key, value)
        for i in range(lvl + 1):
            new_node.forward[i] = update[i].forward[i]
            update[i].forward[i] = new_node

        self.size += 1
        return None

    def delete(self, key) -> int:
        """
        Delete node(s) with a given key.
        Returns number of removed nodes (0, 1, or >1 if allow_duplicates=True).
        """
        count_removed = 0
        while True:
            x, update = self._locate_updates(key)
            target = update[0].forward[0]
            if not target or target.key != key:
                break

            # unlink target at each level
            for i in range(self.level + 1):
                if update[i].forward[i] is target:
                    update[i].forward[i] = target.forward[i]

            # adjust top level if it's now empty
            while self.level > 0 and self.header.forward[self.level] is None:
                self.level -= 1

            self.size -= 1
            count_removed += 1

            if not self.allow_duplicates:
                break

        return count_removed

    def __contains__(self, key) -> bool:
        return self.search(key) is not None

    def __len__(self) -> int:
        return self.size

    # ---------- debugging / convenience ----------
    def display_list(self):
        print("\n***** Skip List *****")
        for lvl in range(self.level, -1, -1):
            print(f"Level {lvl}: ", end="")
            x = self.header.forward[lvl]
            row = []
            while x:
                row.append(str(x.key))
                x = x.forward[lvl]
            print(" -> ".join(row))

    def iter_items(self):
        """Yield (key, value) in sorted order at level 0."""
        x = self.header.forward[0]
        while x:
            yield x.key, x.value
            x = x.forward[0]

    def iter_from(self, key):
        """Iterator starting from the first node with key >= given key."""
        _, update = self._locate_updates(key)
        x = update[0].forward[0]
        while x:
            yield x.key, x.value
            x = x.forward[0]
    
    def __iter__(self):
        """Allow iteration directly over the skip list."""
        return self.iter_items()