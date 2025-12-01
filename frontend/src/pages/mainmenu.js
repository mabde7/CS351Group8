// frontend/src/pages/mainmenu.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getOrCreateUserKey } from "../utils/userKey";
import HeaderBar from "../components/HeaderBar";

const API_BASE = "http://localhost:5000/api";

export default function MainMenu() {
  const { isAuthenticated, user, logout, getIdTokenClaims } = useAuth0();

  const [handle, setHandle] = useState("User");
  const [recent, setRecent] = useState([]);
  const [userKey, setUserKey] = useState(null);

  // Build persistent user key
  useEffect(() => {
    const key = getOrCreateUserKey(isAuthenticated, user);
    setUserKey(key);
  }, [isAuthenticated, user]);

  // "guest" flag set from homepage
  const isGuestBanner = useMemo(
    () => !isAuthenticated && localStorage.getItem("guest") === "true",
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem("guest");
    }
  }, [isAuthenticated]);

  // Router navigation helper
  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Resolve user handle
  useEffect(() => {
    (async () => {
      try {
        const claims = await getIdTokenClaims();
        const extracted =
          claims?.["https://uic.wiki/handle"] ||
          user?.username ||
          user?.nickname ||
          user?.email?.split("@")[0] ||
          "User";
        setHandle(extracted);
      } catch {
        const fallback =
          user?.username ||
          user?.nickname ||
          user?.email?.split("@")[0] ||
          "User";
        setHandle(fallback);
      }
    })();
  }, [getIdTokenClaims, user]);

  // Fetch recent topics
  const fetchRecent = useCallback(async (ukey) => {
    if (!ukey) return;
    try {
      const res = await fetch(
        `${API_BASE}/recent-topics?user=${encodeURIComponent(ukey)}`
      );
      const data = await res.json();
      if (data?.ok && Array.isArray(data.topics)) {
        setRecent(data.topics);
      } else {
        setRecent([]);
      }
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    fetchRecent(userKey);
  }, [userKey, fetchRecent]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchRecent(userKey);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () =>
      document.removeEventListener("visibilitychange", onVisible);
  }, [userKey, fetchRecent]);

  // Save recent topics to database once they are loaded
  useEffect(() => {
    if (isAuthenticated && userKey && recent.length > 0) {
      fetch(`${API_BASE}/recent-topics/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userKey,
        }),
      }).catch(() => {});
    }
  }, [recent, isAuthenticated, userKey]);

  const starterTopics = ["General", "CS", "Math", "English", "Biology"];
  const topicsToShow = recent.length ? recent : starterTopics;

  // Modern Tailwind-based UI
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title="Main Menu" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-10 sm:pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="font-medium">
              Pick a topic or continue browsing
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
            {recent.length ? "Recent Topics" : "Pick a Topic"}
          </h1>
          {isAuthenticated ? (
            <p className="mt-2 text-slate-300">
              Hi,{" "}
              <span className="font-semibold text-white">{handle}</span>
            </p>
          ) : (
            isGuestBanner && (
              <p className="mt-2 text-slate-300">
                Browsing as{" "}
                <span className="font-semibold text-white">Guest</span>
              </p>
            )
          )}
        </div>

        <div className="mt-8 mx-auto max-w-sm w-full grid grid-cols-1 gap-4 justify-items-center">
          {topicsToShow.map((t) => (
            <button
              key={t}
              onClick={() => navigate(`/topic/${encodeURIComponent(t)}`)}
              className="w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition flex items-center justify-between"
            >
              <span>{t}</span>
              <span className="ml-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Open
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => navigate("/topicPage")}
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
          >
            Browse Topics
          </button>

          {/* NEW: User Page button (only when logged in) */}
          {isAuthenticated && (
            <button
              onClick={() => navigate("/userpage")}
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
            >
              User Page
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: window.location.origin,
                  },
                })
              }
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
            >
              Login
            </button>
          )}
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-800">
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
