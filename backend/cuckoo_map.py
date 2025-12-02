# backend/cuckoo_map.py
"""
Simple Cuckoo Hash Map implementation (key -> value).

We use two hash tables and two hash functions. Insertion may evict
existing keys ("cuckoo" them) and reinsert them in the alternate table.
If we detect too many displacements, we rehash to a bigger table.

This is deliberately small and simple because our per-user recents
never exceed 10 entries.
"""

class CuckooHashMap:
    def __init__(self, initial_capacity=16, max_load_factor=0.4, max_displacements=32):
        # Capacity is per table; we keep it as a power of two.
        self._capacity = 1
        while self._capacity < initial_capacity:
            self._capacity <<= 1
        self._max_load = max_load_factor
        self._max_displacements = max_displacements

        self._size = 0
        self._table1 = [None] * self._capacity
        self._table2 = [None] * self._capacity

    # ---- hashing helpers ----
    def _hash1(self, key):
        # low bits of built-in hash
        return hash(key) & (self._capacity - 1)

    def _hash2(self, key):
        # mix hash bits a bit differently
        h = hash(key)
        h ^= (h >> 16)
        return (h * 0x5BD1E995) & (self._capacity - 1)

    # ---- basic API ----
    def __len__(self):
        return self._size

    def _find_slot(self, key):
        i = self._hash1(key)
        e = self._table1[i]
        if e is not None and e[0] == key:
            return (1, i)

        j = self._hash2(key)
        e = self._table2[j]
        if e is not None and e[0] == key:
            return (2, j)

        return None

    def __contains__(self, key):
        return self._find_slot(key) is not None

    def __getitem__(self, key):
        loc = self._find_slot(key)
        if loc is None:
            raise KeyError(key)
        t, idx = loc
        return (self._table1 if t == 1 else self._table2)[idx][1]

    def _set_existing(self, key, value):
        """Update value if key already present; return True if updated."""
        loc = self._find_slot(key)
        if loc is None:
            return False
        t, idx = loc
        if t == 1:
            self._table1[idx] = (key, value)
        else:
            self._table2[idx] = (key, value)
        return True

    def _needs_rehash(self):
        # there are 2 * capacity total slots
        return self._size + 1 > 2 * self._capacity * self._max_load

    def _rehash(self, new_capacity):
        old_items = list(self.items())

        self._capacity = 1
        while self._capacity < new_capacity:
            self._capacity <<= 1

        self._table1 = [None] * self._capacity
        self._table2 = [None] * self._capacity
        self._size = 0

        for k, v in old_items:
            self[k] = v

    def __setitem__(self, key, value):
        # update in place if it already exists
        if self._set_existing(key, value):
            return

        if self._needs_rehash():
            self._rehash(self._capacity * 2)

        k, v = key, value
        for _ in range(self._max_displacements):
            i = self._hash1(k)
            if self._table1[i] is None:
                self._table1[i] = (k, v)
                self._size += 1
                return
            # evict from table1
            (k, v), self._table1[i] = self._table1[i], (k, v)

            j = self._hash2(k)
            if self._table2[j] is None:
                self._table2[j] = (k, v)
                self._size += 1
                return
            # evict from table2
            (k, v), self._table2[j] = self._table2[j], (k, v)

        # too many displacements -> grow and retry
        self._rehash(self._capacity * 2)
        self[k] = v

    def __delitem__(self, key):
        loc = self._find_slot(key)
        if loc is None:
            raise KeyError(key)
        t, idx = loc
        if t == 1:
            self._table1[idx] = None
        else:
            self._table2[idx] = None
        self._size -= 1

    def items(self):
        """Yield (key, value) pairs."""
        for e in self._table1:
            if e is not None:
                yield e
        for e in self._table2:
            if e is not None:
                yield e

    def __iter__(self):
        for k, _ in self.items():
            yield k
