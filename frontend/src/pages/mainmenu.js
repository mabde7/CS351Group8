// frontend/src/pages/mainmenu.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getOrCreateUserKey } from "../utils/userKey";
import HeaderBar from "../components/HeaderBar";

const API_BASE = "http://localhost:5000";

export default function MainMenu() {
  const { isAuthenticated, user, logout, getIdTokenClaims } = useAuth0();

  const [handle, setHandle] = useState("User");
  const [recent, setRecent] = useState([]);
  const [userKey, setUserKey] = useState(null);

  // Persistent user key
  useEffect(() => {
    const key = getOrCreateUserKey(isAuthenticated, user);
    setUserKey(key);
  }, [isAuthenticated, user]);

  // Guest detection
  const isGuestBanner = useMemo(
    () => !isAuthenticated && localStorage.getItem("guest") === "true",
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) localStorage.removeItem("guest");
  }, [isAuthenticated]);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Extract handle
  useEffect(() => {
    (async () => {
      try {
        const claims = await getIdTokenClaims();
        setHandle(
          claims?.["https://uic.wiki/handle"] ||
            user?.username ||
            user?.nickname ||
            user?.email?.split("@")[0] ||
            "User"
        );
      } catch {
        setHandle(
          user?.username ||
            user?.nickname ||
            user?.email?.split("@")[0] ||
            "User"
        );
      }
    })();
  }, [getIdTokenClaims, user]);

  // Fetch recent topics
  const fetchRecent = useCallback(async (ukey) => {
    if (!ukey) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/recent-topics?user=${encodeURIComponent(ukey)}`
      );
      const data = await res.json();
      if (data?.ok && Array.isArray(data.topics)) {
        setRecent(data.topics);
      } else setRecent([]);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    fetchRecent(userKey);
  }, [userKey, fetchRecent]);

  // Base topics
  const starter = ["General", "CS", "Math", "English", "Biology"];
  const topicsToShow = recent.length ? recent : starter;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#001f62",
        border: "3px solid red",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Shared site header */}
      <HeaderBar title="Main Menu" />

      <main
        style={{
          width: "100%",
          paddingTop: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 700, marginTop: "1rem" }}>
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
          {topicsToShow.map((topic) => (
            <button
              key={topic}
              onClick={() => navigate(`/topic/${encodeURIComponent(topic)}`)}
              style={{
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
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Left bottom button */}
        <button
          onClick={() => navigate("/topicPage")}
          style={{
            position: "fixed",
            left: "1rem",
            bottom: "1rem",
            padding: "1rem 1.6rem",
            borderRadius: "12px",
            background: "#ffffff",
            border: "none",
            cursor: "pointer",
            color: "#001f62",
            fontWeight: 700,
            boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
          }}
        >
          Browse Topics
        </button>

        {/* Right bottom auth controls */}
        <div
          style={{
            position: "fixed",
            right: "1rem",
            bottom: "1rem",
            display: "flex",
            gap: "0.8rem",
            alignItems: "center",
            fontSize: "0.95rem",
          }}
        >
          {!isAuthenticated && isGuestBanner && (
            <span>Browsing as <strong>Guest</strong></span>
          )}

          {isAuthenticated ? (
            <>
              <span>Hi, {handle}</span>
              <button
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                style={{
                  padding: "1rem 1.6rem",
                  borderRadius: "12px",
                  background: "#fff",
                  border: "none",
                  cursor: "pointer",
                  color: "#001f62",
                  fontWeight: 700,
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
                background: "#fff",
                border: "none",
                cursor: "pointer",
                color: "#001f62",
                fontWeight: 700,
                boxShadow: "0 5px 14px rgba(0,0,0,0.35)",
              }}
            >
              Login
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
