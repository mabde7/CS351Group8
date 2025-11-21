// frontend/src/pages/userpage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";
import HeaderBar from "../components/HeaderBar";

const API_BASE = "http://localhost:5000";

export default function UserPage() {
  const { isAuthenticated, getAccessTokenSilently, user, loginWithRedirect } =
    useAuth0();

  const [displayName, setDisplayName] = useState("");
  const [createdPosts, setCreatedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // ----------------------------------------------------
  // Load profile (created posts + bookmarks)
  // ----------------------------------------------------
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const token = await getAccessTokenSilently();

      const meRes = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const me = await meRes.json();
      const name =
        me.handle ||
        user?.nickname ||
        user?.username ||
        (user?.email || "").split("@")[0];

      setDisplayName(name);

      const createdIds = JSON.parse(me.created_posts || "[]");
      const bookmarkIds = JSON.parse(me.bookmarks || "[]");

      setBookmarkedIds(new Set(bookmarkIds));

      const unified = Array.from(new Set([...createdIds, ...bookmarkIds]));
      if (unified.length === 0) {
        setCreatedPosts([]);
        setBookmarkedPosts([]);
        setLoading(false);
        return;
      }

      const postsRes = await fetch(
        `${API_BASE}/api/posts/by_ids?ids=${unified.join(",")}`
      );
      const posts = await postsRes.json();
      const byId = new Map(posts.map((p) => [p.postID, p]));

      setCreatedPosts(createdIds.map((id) => byId.get(id)).filter(Boolean));
      setBookmarkedPosts(bookmarkIds.map((id) => byId.get(id)).filter(Boolean));

      setLoading(false);
    } catch (e) {
      console.error("Profile load failed", e);
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ----------------------------------------------------
  // Bookmark toggle (same logic as TopicPage)
  // ----------------------------------------------------
  const isBookmarked = (postID) => bookmarkedIds.has(postID);

  const toggleBookmark = async (post) => {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/userpage" } });
      return;
    }
    const currently = isBookmarked(post.postID);
    const method = currently ? "DELETE" : "POST";

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_BASE}/api/bookmarks/${post.postID}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const newSet = new Set(bookmarkedIds);
      currently ? newSet.delete(post.postID) : newSet.add(post.postID);
      setBookmarkedIds(newSet);

      loadProfile();
    } catch (e) {
      console.error("Bookmark toggle failed:", e);
    }
  };

  // ----------------------------------------------------
  // Styles identical to TopicPage
  // ----------------------------------------------------
  const postButton = {
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
    color: "#001f62",
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
      {/* Header */}
      <HeaderBar title={`Profile: ${displayName}`} />

      {/* Back button */}
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
          boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
        }}
      >
        ← Back
      </button>

      <main
        style={{
          paddingTop: "5.5rem",
          color: "#fff",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* POSTS LIST */}
        <div style={{ width: "min(800px, 92vw)" }}>
          <h2 style={{ textAlign: "center" }}>Your Posts:</h2>
          {loading ? (
            <p>Loading…</p>
          ) : createdPosts.length === 0 ? (
            <p style={{ textAlign: "center" }}>No posts created.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              {createdPosts.map((p) => {
                const title =
                  p.title.length > 40 ? p.title.slice(0, 37) + "..." : p.title;

                return (
                  <button
                    key={p.postID}
                    style={postButton}
                    onClick={() => {
                      setSelectedPost(p);
                      setPostModalOpen(true);
                    }}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* BOOKMARK LIST */}
        <div style={{ width: "min(800px, 92vw)", marginTop: "3rem" }}>
          <h2 style={{ textAlign: "center" }}>Bookmarks:</h2>

          {bookmarkedPosts.length === 0 ? (
            <p style={{ textAlign: "center" }}>No bookmarks yet.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              {bookmarkedPosts.map((p) => {
                const title =
                  p.title.length > 40 ? p.title.slice(0, 37) + "..." : p.title;

                return (
                  <button
                    key={p.postID}
                    style={postButton}
                    onClick={() => {
                      setSelectedPost(p);
                      setPostModalOpen(true);
                    }}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
            {/* Title + bookmark */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>
                {selectedPost.title}
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
              >
                {isBookmarked(selectedPost.postID) ? "★" : "☆"}
              </button>
            </div>

            {/* Meta */}
            <div style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              by <strong>{selectedPost.handle}</strong> ·{" "}
              {new Date(selectedPost.created_at).toLocaleString()}
            </div>

            {/* Content */}
            <div
              style={{ marginTop: "1rem" }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedPost.text || ""),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
