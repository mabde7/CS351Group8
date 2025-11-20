import React, { useEffect, useState } from "react";

export default function UserPage() {
  // Match global theming used on HomePage/MainMenu
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

  // In a real app this would come from your backend / context
  // For now it's just demo data so the UI is modular.
  const [posts] = useState([
    { id: 1, title: "CS 377" },
    { id: 2, title: "CS 341" },
    { id: 3, title: "Math 180" },
    { id: 4, title: "English 161" },
  ]);

  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const styles = {
    main: {
      minHeight: "100vh",
      padding: "2rem",
      color: "#fff",
      position: "relative",
      paddingBottom: "160px",
    },
    banner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      //color: "#fff",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      gap: "1rem",
    },
    bannerTitle: {
      margin: 0,
      fontSize: "3rem",
      lineHeight: 1,
      textAlign: "center",
    },
    contentCard: {
      maxWidth: "960px",
      margin: "3rem auto 0 auto",
      //background: "rgba(0,0,0,0.15)",
      borderRadius: "12px",
      padding: "2rem 2.5rem 2.5rem",
      //boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
    },
    headersRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "2rem",
    },
    sectionLabel: {
      margin: 0,
      fontSize: "2.25rem",
      fontWeight: 600,
      color: "#ff4b4b",
    },
    bodyRow: {
      display: "flex",
      gap: "3rem",
      alignItems: "flex-start",
    },
    postsColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      flex: "0 0 260px",
    },
    postCard: {
      background: "#ffffff",
      color: "#d60000",
      borderRadius: "10px",
      padding: "1.4rem 1.8rem",
      fontSize: "1.4rem",
      fontWeight: 700,
      boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
      textAlign: "center",
    },
    emptyPosts: {
      color: "rgba(255,255,255,0.75)",
      fontStyle: "italic",
      fontSize: "0.95rem",
    },
    bookmarksPlaceholder: {
      flex: 1,
      minHeight: "120px",
      borderRadius: "10px",
      border: "1px dashed rgba(255,255,255,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.7)",
      fontSize: "0.95rem",
      fontStyle: "italic",
    },
    changeUsernameRow: {
      display: "flex",
      justifyContent: "flex-end",
    },
    changeUsernameLink: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#ff4b4b",
      textDecoration: "none",
      textShadow:
        "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
      cursor: "pointer",
    },
    bottomLeftButton: {
      position: "fixed",
      left: "1rem",
      bottom: "1rem",
      padding: "0.5rem 0.8rem",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      zIndex: 20,
    },
    footer: {
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
      pointerEvents: "none",
      background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.06))",
    },
    footerImg: {
      height: "120px",
      maxWidth: "95%",
      width: "auto",
      objectFit: "contain",
    },
  };

  return (
    <main style={styles.main}>
      {/* Top banner, same style as MainMenu */}
      <nav id="banner" style={styles.banner}>
        <h2 style={styles.bannerTitle}>Hello: </h2>
      </nav>

      {/* Centered profile content card */}
      <section style={styles.contentCard}>
        <div style={styles.headersRow}>
          <h3 style={styles.sectionLabel}>Posts</h3>
          <h3 style={styles.sectionLabel}>Bookmarks</h3>
        </div>

        <div style={styles.bodyRow}>
          <div style={styles.postsColumn}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} style={styles.postCard}>
                  {post.title}
                </div>
              ))
            ) : (
              <span style={styles.emptyPosts}>
                You have not created any posts yet.
              </span>
            )}
          </div>

          <div style={styles.bookmarksPlaceholder}>
            Bookmarked topics will appear here.
          </div>
        </div>

        <div style={styles.changeUsernameRow}>
          <a
            href="#"
            style={styles.changeUsernameLink}
            onClick={(e) => e.preventDefault()}
          >
            Change username
          </a>
        </div>

      </section>

      {/* Bottom-left: back to main menu */}
      <button
        onClick={() => navigate("/mainmenu")}
        style={styles.bottomLeftButton}
      >
        Back to main menu
      </button>

      {/* Footer banner image, like MainMenu/HomePage */}
      <footer style={styles.footer}>
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={styles.footerImg}
        />
      </footer>
    </main>
  );
}
