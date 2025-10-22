import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function MainMenu() {
  const { isAuthenticated, user, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();
  const [handle, setHandle] = useState(null);

  // guest flag
  const isGuest = useMemo(() => !isAuthenticated && localStorage.getItem("guest") === "true", [isAuthenticated]);
  useEffect(() => { if (isAuthenticated) localStorage.removeItem("guest"); }, [isAuthenticated]);

  // History helper
  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // get handle from ID token (fallbacks for safety)
  useEffect(() => {
    (async () => {
      try {
        const c = await getIdTokenClaims();
        setHandle(
          c?.["https://uic.wiki/handle"] ||
          user?.username || user?.nickname || user?.email?.split("@")[0] || "User"
        );
      } catch {
        setHandle(user?.username || user?.nickname || user?.email?.split("@")[0] || "User");
      }
    })();
  }, [getIdTokenClaims, user]);

  // send logged-in users to a topic scene (restricted)
  const goToTopic = (tag) => navigate(`/topic/${encodeURIComponent(tag)}`);
  const handleRestrictedAction = (tag) => {
    if (isGuest) {
      alert("You must log in to access this feature.");
      return;
    }
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/mainmenu" } });
      return;
    }
    goToTopic(tag);
  };

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

  const btn = { padding: "0.75rem 1.25rem", borderRadius: "6px", border: "none", cursor: "pointer", width: "220px" };

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", color: "#fff", position: "relative" }}>
      <nav
        id="banner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // keep title centered
          color: "#fff",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "3rem", lineHeight: 1, textAlign: "center" }}>Main menu</h2>
      </nav>

      {/* Guest notice */}
      {isGuest && (
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
            style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem", border: "none", borderRadius: "4px", cursor: "pointer" }}
            onClick={() => loginWithRedirect({ appState: { returnTo: "/mainmenu" } })}
          >
            Log in
          </button>
        </div>
      )}

      <p style={{ margin: 0, fontSize: "3rem", opacity: 0.9, textAlign: "center" }}>Recent searches</p>

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
        {["General", "CS", "Math", "English", "Biology"].map((course) => (
          <button
            key={course}
            style={{ ...btn, opacity: isGuest ? 0.7 : 1 }}
            disabled={isGuest}
            onClick={() => handleRestrictedAction(course)}
            title={isGuest ? "Login required" : `Open ${course}`}
          >
            {course}
          </button>
        ))}
      </div>

      {/* Bottom-left: Browse topics */}
      <button
        onClick={() => navigate("/topicPage")}
        style={{
          position: "fixed", left: "1rem", bottom: "1rem",
          padding: "0.5rem 0.8rem", borderRadius: "6px", border: "none", cursor: "pointer"
        }}
      >
        Browse topics
      </button>

      {/* Bottom-right: welcome + logout (handle-based) */}
      <div style={{ position: "fixed", right: "1rem", bottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
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

      {/* Footer banner pinned to bottom (consistent with other pages) */}
      <footer
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '1.5rem',
          width: '100%',
          position: 'fixed',
          left: 0,
          bottom: 0,
          zIndex: 10,
          background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))'
        }}
      >
        <img src="/UICBanner.svg" alt="UIC Banner" style={{ height: '120px', maxWidth: '95%', width: 'auto', objectFit: 'contain' }} />
      </footer>
    </main>
  );
}
