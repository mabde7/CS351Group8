// frontend/src/pages/topic.js
import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";
import PostEditor from "../components/PostEditor";
import HeaderBar from "../components/HeaderBar";

export default function TopicPage({ topic }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

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

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Load posts
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/posts?tag=${encodeURIComponent(topic)}`
      );
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {}
  }, [topic]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered = posts.filter((p) =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quillIsEmpty = (html) =>
    !html || html.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  // Create a new post
  const submitPost = async (e) => {
    e.preventDefault();
    if (quillIsEmpty(editorContent)) return alert("Write something first.");

    setBusy(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch("http://localhost:5000/api/posts", {
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
    } finally {
      setBusy(false);
    }
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

      {/* MAIN CONTENT */}
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
        {/* SEARCH BAR */}
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
              {filtered.map((p) => (
                <button
                  key={p.postID}
                  style={{
                    padding: "0.7rem 1rem",
                    borderRadius: "10px",
                    background: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#001f62",
                  }}
                  onClick={() => {
                    setSelectedPost(p);
                    setPostModalOpen(true);
                  }}
                >
                  {(p.title || "Untitled").length > 40
                    ? p.title.slice(0, 37) + "…"
                    : p.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* NEW POST BUTTON */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              setNotice("You must log in to post.");
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

      {/* ====================== */}
      {/*   POST VIEW MODAL     */}
      {/* ====================== */}
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
            }}
          >
            {/* TITLE - BOLD WHITE */}
            <h2
              style={{
                marginTop: 0,
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1.6rem",
                textAlign: "center",
              }}
            >
              {selectedPost.title || "Untitled"}
            </h2>

            {/* METADATA */}
            <div
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
                opacity: 0.75,
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              by <strong>{selectedPost.handle}</strong> ·{" "}
              {new Date(selectedPost.created_at).toLocaleString()}
            </div>

            {/* CONTENT - WHITE */}
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "1rem",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "1rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedPost.text || ""),
              }}
            />
          </div>
        </div>
      )}

      {/* ====================== */}
      {/*   CREATE POST MODAL    */}
      {/* ====================== */}
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
            }}
          >
            <h3 style={{ color: "#fff" }}>New post in {topic}</h3>

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
                  color: "#fff",
                  display: "flex",
                  gap: ".4rem",
                  marginBottom: ".5rem",
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

      {/* GUEST TOAST */}
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
