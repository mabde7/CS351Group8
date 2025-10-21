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

  const fetchPosts = () =>
    fetch(`http://localhost:5000/api/posts?tag=${encodeURIComponent(topic)}`)
      .then((r) => r.json()).then(setPosts).catch(console.error);

  useEffect(() => { fetchPosts(); }, [topic]);

  const submitPost = async (e) => {
    e.preventDefault();
    if (!editorContent.trim()) return;
    const token = await getAccessTokenSilently();
    await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: title || "Untitled", text: editorContent, tags: [topic] }),
    });
    setTitle(""); setEditorContent(""); setOpen(false);
    fetchPosts();
  };

  return (
    <main style={{ color: "#fff", background: "#001f62", minHeight: "100vh", padding: "2rem" }}>
      <h2 style={{ textAlign: "center" }}>Topic – {topic}</h2>

      {/* Actions row */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: "1rem 0" }}>
        <div /> {/* left spacer (for future search/sort) */}
        {isAuthenticated && (
          <button
            onClick={() => setOpen(true)}
            style={{ padding: "0.5rem 0.8rem", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            Make a Post
          </button>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.9 }}>No posts yet for {topic}.</p>
      ) : (
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: "1rem" }}>
          {posts.map((p) => (
            <div key={p.postID} style={{ background: "#0a2b8b", padding: "1rem", borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>{p.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.text) }} />
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
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 92vw)", background: "#0b2a88", padding: "1rem",
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
                <button type="button" onClick={() => setOpen(false)}
                  style={{ padding: ".4rem .8rem", borderRadius: 6, border: "none", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: ".4rem .8rem", borderRadius: 6, border: "none", cursor: "pointer", background: "#4caf50", color: "#fff" }}>
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
