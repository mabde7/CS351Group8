'use client';

// OLD-frontend/src/pages/userpage.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DOMPurify from "dompurify";
import HeaderBar from "../components/HeaderBar";
import { useRouter } from 'next/navigation';

const API_BASE = "http://localhost:5000";

export default function UserPage() {
  const { isAuthenticated, getAccessTokenSilently, user, loginWithRedirect } =
    useAuth0();

  const router = useRouter();
  const navigate = (to) => { if (window.location.pathname !== to) router.push(to); };

  const [displayName, setDisplayName] = useState("");
  const [createdPosts, setCreatedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header wrapper to match other pages */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title={`Profile${displayName ? `: ${displayName}` : ''}`} />
        </div>
      </div>

      {/* Actions row */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-start gap-3">
          <button
            onClick={() => navigate('/mainmenu')}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Your Posts */}
        <div>
          <h2 className="text-xl font-bold text-white text-center">Your Posts</h2>
          {loading ? (
            <p className="mt-3 text-center text-slate-300">Loading…</p>
          ) : createdPosts.length === 0 ? (
            <p className="mt-3 text-center text-slate-300">No posts created.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdPosts.map((p) => {
                const title =
                  p.title.length > 40 ? p.title.slice(0, 37) + "..." : p.title;
                return (
                  <button
                    key={p.postID}
                    onClick={() => { setSelectedPost(p); setPostModalOpen(true); }}
                    className="w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition text-left"
                    title={p.title}
                  >
                    <span className="block truncate">{title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bookmarks */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white text-center">Bookmarks</h2>
          {bookmarkedPosts.length === 0 ? (
            <p className="mt-3 text-center text-slate-300">No bookmarks yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarkedPosts.map((p) => {
                const title =
                  p.title.length > 40 ? p.title.slice(0, 37) + "..." : p.title;
                return (
                  <button
                    key={p.postID}
                    onClick={() => { setSelectedPost(p); setPostModalOpen(true); }}
                    className="w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition text-left"
                    title={p.title}
                  >
                    <span className="block truncate">{title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {postModalOpen && selectedPost && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPostModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-slate-800 rounded-xl border border-slate-700 p-6 text-white max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold leading-none">{selectedPost.title}</h2>
              <button
                onClick={() => toggleBookmark(selectedPost)}
                className={`text-2xl leading-none ${isBookmarked(selectedPost.postID) ? 'text-yellow-300' : 'text-slate-400'} hover:opacity-90`}
                title={isBookmarked(selectedPost.postID) ? 'Unbookmark' : 'Bookmark'}
              >
                {isBookmarked(selectedPost.postID) ? '★' : '☆'}
              </button>
            </div>
            <div className="mt-1 text-sm text-slate-300">
              by <strong className="text-white font-semibold">{selectedPost.handle}</strong> · {new Date(selectedPost.created_at).toLocaleString()}
            </div>
            <div
              className="mt-4 text-slate-100"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.text || "") }}
            />
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <footer className="mt-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <img src="/UICBanner.svg" alt="UIC Banner" className="mx-auto h-24 w-auto object-contain opacity-90" />
        </div>
      </footer>
    </main>
  );
}
