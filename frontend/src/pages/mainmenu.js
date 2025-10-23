// frontend/src/pages/mainmenu.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getOrCreateUserKey } from "../utils/userKey"; // adjust path if needed

const API_BASE = "http://localhost:5000"; // change if your backend differs

export default function MainMenu() {
  const { isAuthenticated, user, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();

  // --- UI state ---
  const [handle, setHandle] = useState(null);
  const [recent, setRecent] = useState([]); // strings, most-recent-first
  const [userKey, setUserKey] = useState(null);

  // Compute a stable per-user key (Auth0 sub or guest:<uuid>)
  useEffect(() => {
    setUserKey(getOrCreateUserKey(isAuthenticated, user));
  }, [isAuthenticated, user]);

  // Guest flag used for banner only (navigation now allowed; Router will record)
  const isGuestBanner = useMemo(
    () => !isAuthenticated && localStorage.getItem("guest") === "true",
    [isAuthenticated]
  );
  useEffect(() => {
    if (isAuthenticated) localStorage.removeItem("guest");
  }, [isAuthenticated]);

  // History helper
  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Resolve a friendly handle (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const c = await getIdTokenClaims();
        setHandle(
          c?.["https://uic.wiki/handle"] ||
            user?.username ||
            user?.nickname ||
            user?.email?.split("@")[0] ||
            "User"
        );
      } catch {
        setHandle(
          user?.username || user?.nickname || user?.email?.split("@")[0] || "User"
        );
      }
    })();
  }, [getIdTokenClaims, user]);

  // --- Recent topics (display only; Router handles recording) ---
  const fetchRecent = async (ukey) => {
    if (!ukey) return;
    try {
      const res = await fetch(`${API_BASE}/api/recent-topics?user=${encodeURIComponent(ukey)}`);
      const data = await res.json();
      if (data?.ok) setRecent(Array.isArray(data.topics) ? data.topics : []);
    } catch {
      // swallow errors; show starter list instead
    }
  };

  // Load on mount & when userKey changes
  useEffect(() => {
    fetchRecent(userKey);
  }, [userKey]);

  // Refresh when tab becomes visible again (e.g., after visiting a topic page)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") fetchRecent(userKey);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [userKey]);

  // Page theming (as you had)
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

  // Styling
  const btn = {
    padding: "0.75rem 1.25rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    width: "220px",
  };

  // If no recents yet, show your starter list
  const starter = ["General", "CS", "Math", "English", "Biology"];
  const topicsToShow = recent.length ? recent : starter;

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", color: "#fff", position: "relative",paddingBottom: "160px" }}>
      <nav
        id="banner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "3rem", lineHeight: 1, textAlign: "center" }}>
          Main menu
        </h2>
      </nav>

      {isGuestBanner && (
        <div
          style={{
            backgroundColor: "#fffae5",
            color: "#3a2a00",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          You are browsing as <strong>Guest</strong>. Some actions are restricted.
          <button
            style={{
              marginLeft: "1rem",
              padding: "0.25rem 0.5rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => loginWithRedirect({ appState: { returnTo: "/mainmenu" } })}
          >
            Log in
          </button>
        </div>
      )}

      <p style={{ margin: 0, fontSize: "3rem", opacity: 0.9, textAlign: "center" }}>
        {recent.length ? "Recent searches" : "Try a topic"}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginTop: "4rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {topicsToShow.map((topic) => (
          <button
            key={topic}
            style={{ ...btn, opacity: 1 }}
            onClick={() => navigate(`/topic/${encodeURIComponent(topic)}`)} // Router will record
            title={`Open ${topic}`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Bottom-left: Browse topics (kept clickable via zIndex) */}
      <button
        onClick={() => navigate("/topicPage")}
        style={{
          position: "fixed",
          left: "1rem",
          bottom: "1rem",
          padding: "0.5rem 0.8rem",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          zIndex: 20, // ensure above footer
        }}
      >
        Browse topics
      </button>

      {/* Bottom-right: welcome + logout */}
      <div
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {isAuthenticated ? (
          <>
            <span style={{ opacity: 0.9 }}>Welcome, {handle}.</span>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              style={{ padding: "0.4rem 0.7rem", borderRadius: "6px", border: "none", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => loginWithRedirect({ appState: { returnTo: "/mainmenu" } })}
            style={{ padding: "0.4rem 0.7rem", borderRadius: "6px", border: "none", cursor: "pointer" }}
          >
            Login
          </button>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
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
          pointerEvents: "none" , //makes it so whats underneath it can be clicked in-case its blocking it
          background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))",
        }}
      >
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={{ height: "120px", maxWidth: "95%", width: "auto", objectFit: "contain" }}
        />
      </footer>
    </main>
  );
}
