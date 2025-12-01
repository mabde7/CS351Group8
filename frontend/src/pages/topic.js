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

  // Modernized UI (Tailwind CSS) while preserving functionality
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title={`Topic – ${topic}`} />
        </div>
      </div>

      {/* Back button */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate('/mainmenu')}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
      </div>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Subtags */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Search Posts</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">Find posts in {topic}</h2>

          <input
            type="text"
            placeholder="Search by title…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 w-full rounded-lg border border-slate-700/60 bg-white/95 px-4 py-2 text-slate-900 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {subtags.length > 0 && (
            <div className="mt-3 rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-3 flex flex-wrap gap-2 items-center justify-center text-sm">
              <span className="text-slate-300">Subtopics:</span>
              {subtags.map((st) => (
                <button
                  key={st.fullPath}
                  onClick={() => {
                    if (st.isLeaf) {
                      setActiveTagFilter(st.fullPath);
                    } else {
                      navigate(`/topic/${encodeURIComponent(st.fullPath)}`);
                    }
                  }}
                  className={
                    `px-3 py-1 rounded-full font-semibold shadow-sm transition ` +
                    (st.isLeaf
                      ? 'bg-white text-[#001f62] hover:bg-slate-50'
                      : 'bg-amber-300 text-slate-900 hover:bg-amber-200')
                  }
                >
                  {st.label}
                  {!st.isLeaf && <span> ›</span>}
                </button>
              ))}
            </div>
          )}

          {activeTagFilter && activeTagFilter !== topic && (
            <div className="mt-3 rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-center text-sm">
              Filtering by: <strong className="text-white">{activeTagFilter}</strong>
              <button
                type="button"
                onClick={() => setActiveTagFilter(null)}
                className="ml-2 inline-flex items-center rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-[#001f62] shadow-sm ring-1 ring-slate-300 hover:bg-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Posts list */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white text-center">Posts</h2>

          {filtered.length === 0 ? (
            <p className="mt-3 text-center text-slate-300">No posts yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((p) => {
                const rawTitle = p.title || 'Untitled';
                const displayTitle = rawTitle.length > 40 ? rawTitle.slice(0, 37) + '...' : rawTitle;
                return (
                  <button
                    key={p.postID}
                    onClick={() => {
                      setSelectedPost(p);
                      setPostModalOpen(true);
                    }}
                    title={rawTitle}
                    className="w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition text-left"
                  >
                    {displayTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* New post button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setNotice('You must log in to make a post.');
                setTimeout(() => setNotice(null), 3000);
                return;
              }
              setOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-sm shadow-emerald-500/30 ring-1 ring-inset ring-emerald-400 hover:bg-emerald-600 transition"
          >
            Make a Post
          </button>
        </div>
      </section>

      {/* Post view modal */}
      {postModalOpen && selectedPost && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4"
          onClick={() => setPostModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl text-slate-100 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="m-0 text-2xl font-extrabold text-white">
                {selectedPost.title || 'Untitled'}
              </h2>
              <button
                onClick={() => toggleBookmark(selectedPost)}
                className={`text-2xl transition ${isBookmarked(selectedPost.postID) ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
                aria-label={
                  isBookmarked(selectedPost.postID)
                    ? 'Remove bookmark'
                    : 'Bookmark post'
                }
              >
                {isBookmarked(selectedPost.postID) ? '★' : '☆'}
              </button>
            </div>

            <div className="text-sm mb-3 text-slate-300">
              by <strong className="text-white">{selectedPost.handle || 'Unknown'}</strong>
              {selectedPost.created_at && (
                <>
                  {' '}·{' '}
                  {new Date(selectedPost.created_at).toLocaleString()}
                </>
              )}
            </div>

            {Array.isArray(selectedPost.tags) && selectedPost.tags.length > 0 && (
              <div className="mb-3 text-sm">
                <span className="mr-2 text-slate-300">Tags:</span>
                {selectedPost.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    disabled={tag && tag.trim() === topic}
                    className={`inline-block mr-2 mb-2 px-2 py-1 rounded-full text-xs font-semibold transition ${
                      tag && tag.trim() === topic
                        ? 'bg-slate-400 text-slate-800 cursor-default'
                        : 'bg-white text-[#001f62] hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div
              className="mt-3 leading-relaxed text-slate-100"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedPost.text || ''),
              }}
            />
          </div>
        </div>
      )}

      {/* Create post modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4"
          onClick={() => (!busy ? setOpen(false) : null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-xl text-slate-100"
          >
            <h3 className="mt-0 text-xl font-semibold">New post in {topic}</h3>

            <form onSubmit={submitPost}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-white/95 text-slate-900 px-3 py-2 mb-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <label className="flex items-center gap-2 mb-2 text-sm">
                <input
                  type="checkbox"
                  checked={postAnon}
                  onChange={(e) => setPostAnon(e.target.checked)}
                />
                Post anonymously
              </label>

              <div className="mb-2 text-sm">
                <div className="mb-1">Extra tag (optional, full path like "CS/CS315/Lab1"):</div>
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder='e.g., "CS/CS315/Lab1"'
                  className="w-full rounded-md border border-slate-600 bg-white/95 text-slate-900 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-lg overflow-hidden bg-white">
                <PostEditor value={editorContent} onChange={setEditorContent} />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-slate-300 hover:bg-white transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400 hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  {busy ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest notice */}
      {notice && (
        <div className="fixed inset-x-0 bottom-4 z-50 text-center">
          <div className="inline-block bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg shadow-lg">
            {notice}
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <footer className="mt-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <img
            src="/UICBanner.svg"
            alt="UIC Banner"
            className="mx-auto h-24 w-auto object-contain opacity-90"
          />
        </div>
      </footer>
    </main>
  );
}
