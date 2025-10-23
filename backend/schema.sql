CREATE TABLE IF NOT EXISTS users (
  sub             TEXT PRIMARY KEY,         -- Auth0 stable ID
  handle          TEXT NOT NULL,            -- display username, editable
  email           TEXT,                     -- optional
  bookmarks       TEXT DEFAULT '[]',
  recent_history  TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS posts (
  postID          INTEGER PRIMARY KEY AUTOINCREMENT,
  author_sub      TEXT NOT NULL,            -- references users.sub
  text            TEXT NOT NULL,
  links           TEXT DEFAULT '[]',
  images          TEXT DEFAULT '[]',
  tags            TEXT DEFAULT '[]',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author_sub) REFERENCES users(sub)
);

-- Tag catalog
CREATE TABLE IF NOT EXISTS tags (
  tag             TEXT PRIMARY KEY
);

-- Many-to-many between posts and tags
CREATE TABLE IF NOT EXISTS post_tags (
  postID          INTEGER NOT NULL,
  tag             TEXT NOT NULL,
  PRIMARY KEY (postID, tag),
  FOREIGN KEY (postID) REFERENCES posts(postID) ON DELETE CASCADE,
  FOREIGN KEY (tag) REFERENCES tags(tag) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);