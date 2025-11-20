import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";
import PostEditor from "../PostEditor";

export default function TopicPage({ topic }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // string | null

  function showGuestNotice() {
    setNotice("Posting is restricted to logged-in users.");
    setTimeout(() => setNotice(null), 3000);
  }


  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/posts?tag=${encodeURIComponent(topic.trim())}`
      );
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("GET /api/posts failed", e);
    }
  };

  useEffect(() => {
    console.log("Topic value:", `[${topic}]`);
    fetchPosts();
  }, [topic]);

  const quillIsEmpty = (html) =>
    !html || html.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  const submitPost = async (e) => {
    e.preventDefault();
    if (quillIsEmpty(editorContent)) {
      alert("Write something before posting.");
      return;
    }
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
          text: editorContent,      // HTML from React-Quill
          tags: [topic.trim()],            // important!
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("POST /api/posts failed", res.status, txt);
        alert(`Post failed (${res.status}): ${txt}`);
        return;
      }

      // success: clear, close, and refetch canonical data
      setTitle("");
      setEditorContent("");
      setOpen(false);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Network error posting. Check if the Flask server is running.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ color: "#fff", background: "#001f62", minHeight: "100vh", padding: "2rem" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/mainmenu")}
        style={{
          position: "absolute", left: "1rem", top: "1rem",
          padding: ".4rem .8rem", borderRadius: 6, border: "none", cursor: "pointer"
        }}
      >
        ← Back
      </button>

      <h2 style={{ textAlign: "center" }}>Topic – {topic}</h2>

      {/* Actions row */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "1rem 0", position: "relative", zIndex: 1 }}>
    <button
      onClick={() => {
        if (!isAuthenticated) {
          showGuestNotice();
          return;
        }
        setOpen(true);
      }}
    // Don't use the "disabled" attribute—keep it clickable to show the notice.
      aria-disabled={!isAuthenticated}
      style={{
        padding: "0.5rem 0.8rem",
        borderRadius: 6,
        border: "none",
        cursor: isAuthenticated ? "pointer" : "not-allowed",
        opacity: isAuthenticated ? 1 : 0.5,
        background: isAuthenticated ? "#e6e6e6" : "#c8c8c8",
        color: "#000",
        transition: "opacity .15s ease",
      }}
        title={isAuthenticated ? "Create a post" : "Login required to post"}
  >
        Make a Post
      </button>
    </div>


      {/* Posts list */}
      {posts.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.9 }}>
          No posts yet for {topic}.
        </p>
      ) : (
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: "1rem" }}>
          {posts.map((p) => (
            <div key={p.postID} style={{ background: "#0a2b8b", padding: "1rem", borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>{p.title}</h3>
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.text) }}
              />
              {p.tags?.length ? (
                <small style={{ opacity: 0.8 }}>Tags: {p.tags.join(", ")}</small>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Modal editor */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
          }}
          onClick={() => (busy ? null : setOpen(false))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 92vw)", background: "#0b2a88", padding: "1rem",
              borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.4)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>New post in {topic}</h3>
            <form onSubmit={submitPost}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: ".5rem", borderRadius: 6, border: "none", marginBottom: ".75rem" }}
              />
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
                <PostEditor value={editorContent} onChange={setEditorContent} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem", marginTop: ".75rem" }}>
                <button type="button" disabled={busy}
                  onClick={() => setOpen(false)}
                  style={{ padding: ".4rem .8rem", borderRadius: 6, border: "none", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy}
                  style={{ padding: ".4rem .8rem", borderRadius: 6, border: "none", cursor: "pointer",
                           background: "#4caf50", color: "#fff" }}>
                  {busy ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest notice at bottom center */}
      {notice && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "1.25rem",
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              background: "#fffbe6",
              color: "#3a2a00",
              border: "1px solid #f0e6b6",
              borderRadius: 8,
              padding: ".6rem 1rem",
              boxShadow: "0 6px 20px rgba(0,0,0,.25)",
              textAlign: "center",
              pointerEvents: "auto",
              maxWidth: "85%"
            }}
          >
            {notice}
          </div>
        </div>
      )}
    </main>
  );
}
