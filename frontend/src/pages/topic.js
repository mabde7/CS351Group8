// frontend/src/pages/topic.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";
import PostEditor from "../components/PostEditor";
import HeaderBar from "../components/HeaderBar";
import { getOrCreateUserKey } from "../utils/userKey";

const API_BASE = "http://localhost:5000";

export default function TopicPage({ topic }) {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [postAnon, setPostAnon] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // user key for recent-topics skiplist
  const [userKey, setUserKey] = useState(null);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // -------------------------------------------------
  // Build persistent user key (same logic as MainMenu)
  // -------------------------------------------------
  useEffect(() => {
    const key = getOrCreateUserKey(isAuthenticated, user);
    setUserKey(key);
  }, [isAuthenticated, user]);

  // ---------------------------
  // Fetch posts for this topic
  // ---------------------------
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/posts?tag=${encodeURIComponent(topic)}`
      );
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  }, [topic]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ---------------------------
  // Record this topic in recents
  // ---------------------------
  const recordRecentTopic = useCallback(async () => {
    if (!userKey || !topic) return;

    try {
      await fetch(`${API_BASE}/api/recent-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userKey, tag: topic }),
      });
    } catch (err) {
      console.error("Failed to record recent topic", err);
    }
  }, [userKey, topic]);

  useEffect(() => {
    recordRecentTopic();
  }, [recordRecentTopic]);

  // ---------------------------
  // Load bookmarks for user
  // ---------------------------
  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarkedIds(new Set());
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_BASE}/api/bookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const ids = Array.isArray(data.ids) ? data.ids : [];
      setBookmarkedIds(new Set(ids));
    } catch (err) {
      console.error("Failed to load bookmarks", err);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const isBookmarked = (postID) => bookmarkedIds.has(postID);

  const toggleBookmark = async (post) => {
    if (!post || !post.postID) return;

    if (!isAuthenticated) {
      setNotice("You must log in to bookmark posts.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const currentlyBookmarked = isBookmarked(post.postID);
    const method = currentlyBookmarked ? "DELETE" : "POST";

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(
        `${API_BASE}/api/bookmarks/${post.postID}`,
        {
          method,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;

      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (currentlyBookmarked) {
          next.delete(post.postID);
        } else {
          next.add(post.postID);
        }
        return next;
      });
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  // ---------------------------
  // Filtering & helpers
  // ---------------------------
  const filtered = posts.filter((p) =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quillIsEmpty = (html) =>
    !html || html.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  const submitPost = async (e) => {
    e.preventDefault();
    if (quillIsEmpty(editorContent)) {
      alert("Write something first.");
      return;
    }

    setBusy(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || "Untitled",
          text: editorContent,
          tags: [topic],
          anonymous: postAnon,
        }),
      });

      if (!res.ok) {
        alert("Post failed.");
        return;
      }

      setTitle("");
      setEditorContent("");
      setPostAnon(false);
      setOpen(false);
      fetchPosts();
      // also re-record in recents on successful post
      recordRecentTopic();
    } finally {
      setBusy(false);
    }
  };

  const postButtonStyle = {
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    background: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.95rem",
    maxWidth: "40ch",
    minWidth: "12ch",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center",
    boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#001f62",
        border: "3px solid red",
        boxSizing: "border-box",
      }}
    >
      <HeaderBar title={`Topic – ${topic}`} />

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/mainmenu")}
        style={{
          position: "absolute",
          left: "1rem",
          top: "6rem",
          padding: "0.7rem 1.2rem",
          borderRadius: "10px",
          background: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          color: "#001f62",
        }}
      >
        ← Back
      </button>

      <main
        style={{
          paddingTop: "5.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#fff",
          width: "100%",
        }}
      >
        {/* SEARCH */}
        <div style={{ width: "min(800px, 92vw)" }}>
          <h2 style={{ textAlign: "center" }}>Search Posts</h2>
          <input
            type="text"
            placeholder="Search by title…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "none",
            }}
          />
        </div>

        {/* POSTS */}
        <div style={{ width: "min(800px, 92vw)", marginTop: "2rem" }}>
          <h2 style={{ textAlign: "center" }}>Posts</h2>

          {filtered.length === 0 ? (
            <p style={{ textAlign: "center" }}>No posts yet.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              {filtered.map((p) => {
                const rawTitle = p.title || "Untitled";
                const displayTitle =
                  rawTitle.length > 40
                    ? rawTitle.slice(0, 37) + "..."
                    : rawTitle;

                return (
                  <button
                    key={p.postID}
                    style={postButtonStyle}
                    onClick={() => {
                      setSelectedPost(p);
                      setPostModalOpen(true);
                    }}
                    title={rawTitle}
                  >
                    {displayTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* NEW POST BUTTON */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              setNotice("You must log in to make a post.");
              setTimeout(() => setNotice(null), 3000);
              return;
            }
            setOpen(true);
          }}
          style={{
            marginTop: "3rem",
            padding: "1rem 2rem",
            background: "#fff",
            color: "#001f62",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
          }}
        >
          Make a Post
        </button>
      </main>

      {/* POST VIEW MODAL */}
      {postModalOpen && selectedPost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 20,
          }}
          onClick={() => setPostModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(850px, 92vw)",
              background: "#0b2a88",
              padding: "2rem",
              borderRadius: "12px",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "#fff",
            }}
          >
            {/* Title + bookmark star row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                {selectedPost.title || "Untitled"}
              </h2>
              <button
                onClick={() => toggleBookmark(selectedPost)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.8rem",
                  color: isBookmarked(selectedPost.postID)
                    ? "#ffd54f"
                    : "#bbbbbb",
                }}
                aria-label={
                  isBookmarked(selectedPost.postID)
                    ? "Remove bookmark"
                    : "Bookmark post"
                }
              >
                {isBookmarked(selectedPost.postID) ? "★" : "☆"}
              </button>
            </div>

            {/* Meta row */}
            <div
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
                opacity: 0.9,
              }}
            >
              by{" "}
              <strong>{selectedPost.handle || "Unknown"}</strong>
              {selectedPost.created_at && (
                <>
                  {" "}
                  ·{" "}
                  {new Date(selectedPost.created_at).toLocaleString()}
                </>
              )}
            </div>

            {/* Post body - white text */}
            <div
              style={{
                marginTop: "0.75rem",
                lineHeight: 1.5,
                color: "#fff",
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedPost.text || ""),
              }}
            />
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 25,
          }}
          onClick={() => (!busy ? setOpen(false) : null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 92vw)",
              background: "#0b2a88",
              padding: "1.2rem",
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              color: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>New post in {topic}</h3>

            <form onSubmit={submitPost}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".5rem",
                  borderRadius: 6,
                  border: "none",
                  marginBottom: ".5rem",
                }}
              />

              <label
                style={{
                  display: "flex",
                  gap: ".4rem",
                  marginBottom: ".5rem",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={postAnon}
                  onChange={(e) => setPostAnon(e.target.checked)}
                />
                Post anonymously
              </label>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <PostEditor
                  value={editorContent}
                  onChange={setEditorContent}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: ".5rem",
                  marginTop: ".75rem",
                }}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  style={{
                    padding: ".4rem .8rem",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    padding: ".4rem .9rem",
                    borderRadius: 6,
                    border: "none",
                    background: "#4caf50",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {busy ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Notice */}
      {notice && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "1rem",
            textAlign: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#fffbe6",
              color: "#3a2a00",
              border: "1px solid #e6d894",
              padding: ".6rem 1rem",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            }}
          >
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
