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

  const [subtags, setSubtags] = useState([]);
  const [activeTagFilter, setActiveTagFilter] = useState(null);

  const [customTag, setCustomTag] = useState("");

  const [userKey, setUserKey] = useState(null);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Build persistent user key (for recent-topics)
  useEffect(() => {
    const key = getOrCreateUserKey(isAuthenticated, user);
    setUserKey(key);
  }, [isAuthenticated, user]);

  // -------------------------------------------------
  // Fetch posts for this topic (parent sees all descendants)
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Record this topic in recents
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Compute subtags from current posts (for chips under search)
  // -------------------------------------------------
  useEffect(() => {
    // Reset leaf filter whenever topic or posts change
    setActiveTagFilter(null);

    const allTags = new Set();
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => allTags.add(t));
    });

    const tagsArray = Array.from(allTags);
    if (!tagsArray.length) {
      setSubtags([]);
      return;
    }

    const topicSegs = (topic || "")
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    const depth = topicSegs.length;

    const childrenMap = {};

    tagsArray.forEach((tag) => {
      const segs = (tag || "")
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      if (segs.length <= depth) return;

      // Must share prefix with the current topic
      for (let i = 0; i < depth; i++) {
        if (segs[i] !== topicSegs[i]) return;
      }

      const childSeg = segs[depth];
      const childPath = [...topicSegs, childSeg].join("/");

      if (!childrenMap[childPath]) {
        childrenMap[childPath] = {
          label: childSeg,
          fullPath: childPath,
          isLeaf: true,
        };
      }
    });

    const childList = Object.values(childrenMap);

    // Detect which child paths have descendants (non-leaf)
    childList.forEach((child) => {
      const prefix = child.fullPath + "/";
      const hasDescendant = tagsArray.some(
        (t) => t !== child.fullPath && t.startsWith(prefix)
      );
      child.isLeaf = !hasDescendant;
    });

    childList.sort((a, b) => a.label.localeCompare(b.label));
    setSubtags(childList);
  }, [posts, topic]);

  // -------------------------------------------------
  // Load bookmarks for user
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Tag click behavior in modal:
  //   - If tag === current topic => ignore
  //   - If tag has descendants => navigate to its Topic page
  //   - Else (leaf) => filter posts in this topic by that tag
  // -------------------------------------------------
  const tagHasDescendants = (tagPath) => {
    const prefix = tagPath + "/";
    // any tag on any post that is strictly deeper
    return posts.some((p) =>
      (p.tags || []).some((t) => t !== tagPath && t.startsWith(prefix))
    );
  };

  const handleTagClick = (tagPath) => {
    const cleaned = (tagPath || "").trim();
    if (!cleaned) return;

    // Never filter by the main topic itself
    if (cleaned === topic) return;

    if (tagHasDescendants(cleaned)) {
      // Parent-style tag -> jump to a new TopicPage
      navigate(`/topic/${encodeURIComponent(cleaned)}`);
    } else {
      // Leaf-style tag -> filter within current topic
      setActiveTagFilter(cleaned);
    }
  };

  // -------------------------------------------------
  // Filtering & helpers
  // -------------------------------------------------
  const quillIsEmpty = (html) =>
    !html || html.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  // First apply leaf-tag filter (if any), then text search
  const tagFiltered = activeTagFilter
    ? posts.filter((p) => (p.tags || []).includes(activeTagFilter))
    : posts;

  const filtered = tagFiltered.filter((p) =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -------------------------------------------------
  // Submit new post
  //   - Only send *full* tag paths
  //   - If user provides customTag, that becomes the full path
  //   - Otherwise, the current topic itself is used as the tag
  // -------------------------------------------------
  const submitPost = async (e) => {
    e.preventDefault();
    if (quillIsEmpty(editorContent)) {
      alert("Write something first.");
      return;
    }

    setBusy(true);
    try {
      const token = await getAccessTokenSilently();

      let tagsToSend = [];
      const trimmedCustom = (customTag || "").trim();
      const trimmedTopic = (topic || "").trim();

      if (trimmedCustom) {
        // User provided explicit full path (e.g., "CS/CS315/Lab1")
        tagsToSend.push(trimmedCustom);
      } else if (trimmedTopic) {
        // No extra tag; treat the current topic as the full tag path
        tagsToSend.push(trimmedTopic);
      }

      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || "Untitled",
          text: editorContent,
          tags: tagsToSend,
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
      setCustomTag("");
      setOpen(false);

      await fetchPosts();
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
        display: "flex",
        flexDirection: "column",
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
        {/* SEARCH + SUBTAGS */}
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

          {subtags.length > 0 && (
            <div
              style={{
                marginTop: "0.7rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                background: "#132b82",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
              }}
            >
              <span>Subtopics:</span>
              {subtags.map((st) => (
                <button
                  key={st.fullPath}
                  onClick={() => {
                    if (st.isLeaf) {
                      // Leaf: filter within current topic
                      setActiveTagFilter(st.fullPath);
                    } else {
                      // Parent: jump to its topic page
                      navigate(
                        `/topic/${encodeURIComponent(st.fullPath)}`
                      );
                    }
                  }}
                  style={{
                    padding: "0.3rem 0.7rem",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    background: st.isLeaf ? "#ffffff" : "#ffd54f",
                    color: "#001f62",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                  }}
                >
                  {st.label}
                  {st.isLeaf ? "" : " ›"}
                </button>
              ))}
            </div>
          )}

          {activeTagFilter && activeTagFilter !== topic && (
            <div
              style={{
                marginTop: "0.7rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                background: "#132b82",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              Filtering by: <strong>{activeTagFilter}</strong>
              <button
                type="button"
                onClick={() => setActiveTagFilter(null)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* POSTS LIST */}
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
            {/* Title + bookmark star */}
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
                  {new Date(
                    selectedPost.created_at
                  ).toLocaleString()}
                </>
              )}
            </div>

            {/* Tags row */}
            {Array.isArray(selectedPost.tags) &&
              selectedPost.tags.length > 0 && (
                <div
                  style={{
                    marginBottom: "0.75rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ marginRight: "0.4rem" }}>
                    Tags:
                  </span>
                  {selectedPost.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      style={{
                        display: "inline-block",
                        marginRight: "0.4rem",
                        marginBottom: "0.3rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        border: "none",
                        cursor:
                          tag && tag.trim() === topic
                            ? "default"
                            : "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background:
                          tag && tag.trim() === topic
                            ? "#bbbbbb"
                            : "#ffffff",
                        color: "#001f62",
                      }}
                      disabled={tag && tag.trim() === topic}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

            {/* Body */}
            <div
              style={{
                marginTop: "0.75rem",
                lineHeight: 1.5,
                color: "#fff",
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  selectedPost.text || ""
                ),
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

              <div style={{ marginBottom: ".5rem", fontSize: "0.85rem" }}>
                <div style={{ marginBottom: "0.25rem" }}>
                  Extra tag (optional, full path like "CS/CS315/Lab1"):
                </div>
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder='e.g., "CS/CS315/Lab1"'
                  style={{
                    width: "100%",
                    padding: ".4rem",
                    borderRadius: 6,
                    border: "none",
                  }}
                />
              </div>

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

      {/* Footer Banner */}
      <footer
        style={{
          marginTop: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "2rem 0",
        }}
      >
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={{
            height: "150px",
            maxWidth: "95%",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </footer>
    </div>
  );
}
