// frontend/src/pages/userpage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";

const API_BASE = "http://localhost:5000";

export default function UserPage() {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user } =
    useAuth0();

  const [createdPosts, setCreatedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // match global theming
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#001f62";
    document.body.style.fontFamily =
      'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", Helvetica, Arial, sans-serif';
    return () => {
      document.body.style.background = "";
      document.body.style.margin = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  const isBookmarked = (postID) => bookmarkedIds.has(postID);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await getAccessTokenSilently();

      // Fetch user row
      const meRes = await fetch(`${API_BASE}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!meRes.ok) {
        setError("Failed to load profile.");
        setLoading(false);
        return;
      }

      const me = await meRes.json();

      const createdIds = JSON.parse(me.created_posts || "[]");
      const bookmarkIds = JSON.parse(me.bookmarks || "[]");

      setBookmarkedIds(new Set(bookmarkIds));

      const nameFromRow =
        me.handle ||
        user?.nickname ||
        user?.username ||
        (user?.email || "").split("@")[0] ||
        "User";

      setDisplayName(nameFromRow);

      const unionIds = Array.from(new Set([...createdIds, ...bookmarkIds]));
      if (!unionIds.length) {
        setCreatedPosts([]);
        setBookmarkedPosts([]);
        setLoading(false);
        return;
      }

      // Fetch all posts in one go
      const postsRes = await fetch(
        `${API_BASE}/api/posts/by_ids?ids=${unionIds.join(",")}`
      );
      if (!postsRes.ok) {
        setError("Failed to load posts for profile.");
        setLoading(false);
        return;
      }

      const postsData = await postsRes.json();
      const byId = new Map(
        postsData.map((p) => [p.postID, p])
      );

      setCreatedPosts(
        createdIds
          .map((id) => byId.get(id))
          .filter(Boolean)
      );

      setBookmarkedPosts(
        bookmarkIds
          .map((id) => byId.get(id))
          .filter(Boolean)
      );

      setLoading(false);
    } catch (err) {
      console.error("Profile load error", err);
      setError("Error loading profile.");
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const toggleBookmark = async (post) => {
    if (!post || !post.postID) return;

    if (!isAuthenticated) {
      // push them to login
      await loginWithRedirect({
        appState: { returnTo: "/userpage" },
      });
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

      // Update local bookmark ID set
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (currentlyBookmarked) {
          next.delete(post.postID);
        } else {
          next.add(post.postID);
        }
        return next;
      });

      // Refresh lists so "Bookmarks" column updates correctly
      loadProfile();
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  const styles = {
    main: {
      minHeight: "100vh",
      padding: "2rem",
      color: "#fff",
      position: "relative",
      paddingBottom: "160px",
      boxSizing: "border-box",
    },
    banner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      border: "3px solid red",
      background: "#0d2fa5",
    },
    bannerTitle: {
      margin: 0,
      fontSize: "2.4rem",
      lineHeight: 1,
      textAlign: "center",
    },
    contentCard: {
      maxWidth: "960px",
      margin: "3rem auto 0 auto",
      borderRadius: "12px",
      padding: "2rem 2.5rem 2.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
      border: "3px solid red",
      background: "rgba(0,0,0,0.25)",
    },
    headersRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "2rem",
    },
    sectionLabel: {
      margin: 0,
      fontSize: "2.0rem",
      fontWeight: 600,
      color: "#ff4b4b",
    },
    bodyRow: {
      display: "flex",
      gap: "3rem",
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
    postsColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "1.0rem",
      flex: "0 0 260px",
    },
    postCardButton: {
      background: "#ffffff",
      color: "#d60000",
      borderRadius: "10px",
      padding: "1.0rem 1.2rem",
      fontSize: "1.1rem",
      fontWeight: 700,
      boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
      textAlign: "center",
      border: "none",
      cursor: "pointer",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "22ch",
    },
    emptyPosts: {
      color: "rgba(255,255,255,0.75)",
      fontStyle: "italic",
      fontSize: "0.95rem",
    },
    bookmarksColumn: {
      flex: 1,
      minWidth: "260px",
      display: "flex",
      flexDirection: "column",
      gap: "1.0rem",
    },
    changeUsernameRow: {
      display: "flex",
      justifyContent: "flex-end",
    },
    changeUsernameLink: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#ff4b4b",
      textDecoration: "none",
      textShadow:
        "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
      cursor: "pointer",
    },
    bottomLeftButton: {
      position: "fixed",
      left: "1rem",
      bottom: "1rem",
      padding: "0.6rem 1rem",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      zIndex: 20,
      background: "#ffffff",
      color: "#001f62",
      fontWeight: 700,
      boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
    },
    footer: {
      marginTop: "auto",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: "1.5rem",
      width: "100%",
      position: "fixed",
      left: 0,
      bottom: 0,
      zIndex: 10,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))",
    },
    footerImg: {
      height: "120px",
      maxWidth: "95%",
      width: "auto",
      objectFit: "contain",
    },
  };

  if (!isAuthenticated) {
    return (
      <main style={styles.main}>
        <nav id="banner" style={styles.banner}>
          <h2 style={styles.bannerTitle}>Please log in to view your page</h2>
        </nav>

        <section style={styles.contentCard}>
          <p>
            You need to be logged in to see your posts and bookmarks.
          </p>
          <button
            onClick={() =>
              loginWithRedirect({ appState: { returnTo: "/userpage" } })
            }
            style={{
              padding: "0.8rem 1.4rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              background: "#fff",
              color: "#001f62",
              boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
            }}
          >
            Log in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      {/* Top banner */}
      <nav id="banner" style={styles.banner}>
        <h2 style={styles.bannerTitle}>Hello, {displayName}</h2>
      </nav>

      {/* Centered profile content card */}
      <section style={styles.contentCard}>
        {loading ? (
          <p>Loading your posts and bookmarks…</p>
        ) : error ? (
          <p style={{ color: "#ffb3b3" }}>{error}</p>
        ) : (
          <>
            <div style={styles.headersRow}>
              <h3 style={styles.sectionLabel}>Posts</h3>
              <h3 style={styles.sectionLabel}>Bookmarks</h3>
            </div>

            <div style={styles.bodyRow}>
              {/* Created Posts column */}
              <div style={styles.postsColumn}>
                {createdPosts.length > 0 ? (
                  createdPosts.map((post) => {
                    const title = post.title || "Untitled";
                    const shortTitle =
                      title.length > 22
                        ? title.slice(0, 19) + "..."
                        : title;
                    return (
                      <button
                        key={post.postID}
                        style={styles.postCardButton}
                        onClick={() => {
                          setSelectedPost(post);
                          setPostModalOpen(true);
                        }}
                        title={title}
                      >
                        {shortTitle}
                      </button>
                    );
                  })
                ) : (
                  <span style={styles.emptyPosts}>
                    You have not created any posts yet.
                  </span>
                )}
              </div>

              {/* Bookmarks column */}
              <div style={styles.bookmarksColumn}>
                {bookmarkedPosts.length > 0 ? (
                  bookmarkedPosts.map((post) => {
                    const title = post.title || "Untitled";
                    const shortTitle =
                      title.length > 30
                        ? title.slice(0, 27) + "..."
                        : title;
                    return (
                      <button
                        key={post.postID}
                        style={styles.postCardButton}
                        onClick={() => {
                          setSelectedPost(post);
                          setPostModalOpen(true);
                        }}
                        title={title}
                      >
                        {shortTitle}
                      </button>
                    );
                  })
                ) : (
                  <span style={styles.emptyPosts}>
                    You have no bookmarked posts yet.
                  </span>
                )}
              </div>
            </div>

            <div style={styles.changeUsernameRow}>
             <button
                onClick={() => alert("Username changes coming soon")}
                style={{
                  ...styles.changeUsernameLink,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                >
                  Change username
                </button>

            </div>
          </>
        )}
      </section>

      {/* Bottom-left: back to main menu */}
      <button
        onClick={() => navigate("/mainmenu")}
        style={styles.bottomLeftButton}
      >
        Back to main menu
      </button>

      {/* Footer banner image */}
      <footer style={styles.footer}>
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={styles.footerImg}
        />
      </footer>

      {/* Post View Modal (same style as TopicPage) */}
      {postModalOpen && selectedPost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 40,
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

            {/* Body */}
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
    </main>
  );
}
