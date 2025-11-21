// frontend/src/pages/mainmenu.js
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
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
          user: userKey
        })
      }).catch(() => {});
    }
  }, [recent, isAuthenticated, userKey]);

  const starterTopics = ["General", "CS", "Math", "English", "Biology"];
  const topicsToShow = recent.length ? recent : starterTopics;

  const topicButtonStyle = {
    padding: "1rem",
    width: "min(330px, 85vw)",
    borderRadius: "10px",
    border: "none",
    background: "#ffffff",
    color: "#001f62",
    fontWeight: 700,
    fontSize: "1.1rem",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        background: "#001f62",
        color: "#fff",
        border: "3px solid red",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Fixed header bar */}
      <HeaderBar title="Main Menu" />

      {/* Profile button top-left, under header */}
      <button
        onClick={() => {
          if (!isAuthenticated) return;
          navigate("/userpage");
        }}
        disabled={!isAuthenticated}
        style={{
          position: "absolute",
          left: "1rem",
          top: "6rem",
          padding: "0.7rem 1.2rem",
          borderRadius: "10px",
          border: "none",
          background: "#ffffff",
          color: "#001f62",
          fontWeight: 700,
          cursor: isAuthenticated ? "pointer" : "not-allowed",
          opacity: isAuthenticated ? 1 : 0.4,
          boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
        }}
      >
        Profile
      </button>

      <h2
        style={{
          marginTop: "1.5rem",
          fontSize: "2rem",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {recent.length ? "Recent Topics" : "Pick a Topic"}
      </h2>

      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          alignItems: "center",
          width: "100%",
        }}
      >
        {topicsToShow.map((t) => (
          <button
            key={t}
            style={topicButtonStyle}
            onClick={() =>
              navigate(`/topic/${encodeURIComponent(t)}`)
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Bottom-left: Browse Topics */}
      <button
        onClick={() => navigate("/topicPage")}
        style={{
          position: "fixed",
          left: "1rem",
          bottom: "1rem",
          padding: "1rem 1.6rem",
          borderRadius: "12px",
          border: "none",
          background: "#ffffff",
          color: "#001f62",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
        }}
      >
        Browse Topics
      </button>

      {/* Bottom-right: auth controls */}
      <div
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          display: "flex",
          gap: "0.8rem",
          alignItems: "center",
        }}
      >
        {!isAuthenticated && isGuestBanner && (
          <span style={{ color: "#fff", fontSize: "0.95rem" }}>
            Browsing as <strong>Guest</strong>
          </span>
        )}

        {isAuthenticated ? (
          <>
            <span style={{ color: "#fff", fontSize: "0.95rem" }}>
              Hi, {handle}
            </span>
            <button
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: window.location.origin,
                  },
                })
              }
              style={{
                padding: "1rem 1.6rem",
                borderRadius: "12px",
                border: "none",
                background: "#ffffff",
                cursor: "pointer",
                color: "#001f62",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "1rem 1.6rem",
              borderRadius: "12px",
              border: "none",
              background: "#ffffff",
              cursor: "pointer",
              color: "#001f62",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
            }}
          >
            Login
          </button>
        )}
      </div>
    </main>
  );
}
