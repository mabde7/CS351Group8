-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  sub             TEXT PRIMARY KEY,         -- Auth0 stable ID
  handle          TEXT,                     -- display username
  email           TEXT,                     -- optional
  bookmarks       TEXT DEFAULT '[]',        -- JSON list of bookmarked postIDs
  recent_history  TEXT DEFAULT '[]',        -- JSON list of recent topics
  created_posts   TEXT DEFAULT '[]'         -- JSON list of postIDs the user created
);

-- ========================================
-- POSTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS posts (
  postID          SERIAL PRIMARY KEY,       -- Postgres auto-increment
  author_sub      TEXT NOT NULL,            -- references users.sub
  title           TEXT NOT NULL,
  text            TEXT NOT NULL,            -- HTML content
  links           TEXT DEFAULT '[]',        -- JSON
  images          TEXT DEFAULT '[]',        -- JSON
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author_sub) REFERENCES users(sub)
);

-- ========================================
-- TAG CATALOG
-- ========================================
CREATE TABLE IF NOT EXISTS tags (
  tag             TEXT PRIMARY KEY
);

-- ========================================
-- MANY-TO-MANY: POSTS ↔ TAGS
-- ========================================
CREATE TABLE IF NOT EXISTS post_tags (
  postID          INTEGER NOT NULL,
  tag             TEXT NOT NULL,
  PRIMARY KEY (postID, tag),
  FOREIGN KEY(postID) REFERENCES posts(postID) ON DELETE CASCADE,
  FOREIGN KEY(tag) REFERENCES tags(tag) ON DELETE CASCADE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
