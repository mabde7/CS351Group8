CREATE TABLE IF NOT EXISTS users (
  email           TEXT PRIMARY KEY,
  username        TEXT,
  posts           TEXT DEFAULT '[]',         
  bookmarks       TEXT DEFAULT '[]',   
  recent_history  TEXT DEFAULT '[]'           
);

CREATE TABLE IF NOT EXISTS posts (
  postID  INTEGER PRIMARY KEY AUTOINCREMENT,
  text    TEXT NOT NULL,
  links   TEXT DEFAULT '[]',              
  images  TEXT DEFAULT '[]',              
  tags    TEXT DEFAULT '[]'                
);
