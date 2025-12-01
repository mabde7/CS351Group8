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

  // Modern Tailwind UI replacing legacy inline styles
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title={`Profile: ${displayName || 'User'}`} />
        </div>
      </div>

      {/* Back button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate('/mainmenu')}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-12">
          {/* Created Posts */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Your Posts</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white text-center">Created Posts</h2>
            {loading ? (
              <p className="mt-4 text-center text-slate-300">Loading…</p>
            ) : createdPosts.length === 0 ? (
              <p className="mt-4 text-center text-slate-400">No posts created.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {createdPosts.map((p) => {
                  const rawTitle = p.title || 'Untitled';
                  const title = rawTitle.length > 40 ? rawTitle.slice(0, 37) + '…' : rawTitle;
                  return (
                    <button
                      key={p.postID}
                      onClick={() => { setSelectedPost(p); setPostModalOpen(true); }}
                      title={rawTitle}
                      className="group relative w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition text-left"
                    >
                      <span className="block truncate pr-8">{title}</span>
                      <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-emerald-400/60 transition" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bookmarks */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-medium">Your Bookmarks</span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white text-center">Bookmarks</h2>
            {bookmarkedPosts.length === 0 ? (
              <p className="mt-4 text-center text-slate-400">No bookmarks yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {bookmarkedPosts.map((p) => {
                  const rawTitle = p.title || 'Untitled';
                  const title = rawTitle.length > 40 ? rawTitle.slice(0, 37) + '…' : rawTitle;
                  return (
                    <button
                      key={p.postID}
                      onClick={() => { setSelectedPost(p); setPostModalOpen(true); }}
                      title={rawTitle}
                      className="group relative w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition text-left"
                    >
                      <span className="block truncate pr-8">{title}</span>
                      <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-amber-400/60 transition" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
                aria-label={isBookmarked(selectedPost.postID) ? 'Remove bookmark' : 'Bookmark post'}
              >
                {isBookmarked(selectedPost.postID) ? '★' : '☆'}
              </button>
            </div>
            <div className="text-sm mb-3 text-slate-300">
              by <strong className="text-white">{selectedPost.handle || 'Unknown'}</strong>
              {selectedPost.created_at && (
                <> {' '}·{' '}{new Date(selectedPost.created_at).toLocaleString()} </>
              )}
            </div>
            <div
              className="mt-3 leading-relaxed text-slate-100"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.text || '') }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <img src="/UICBanner.svg" alt="UIC Banner" className="mx-auto h-24 w-auto object-contain opacity-90" />
        </div>
      </footer>
    </main>
  );
}
