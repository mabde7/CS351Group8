import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import HeaderBar from '../components/HeaderBar';

export default function HomePage() {
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.background = '#001f62';
    document.body.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", Helvetica, Arial, sans-serif';
    return () => {
      document.body.style.background = '';
      document.body.style.margin = '';
      document.body.style.fontFamily = '';
    };
  }, []);

    //Auto-register user in backend when logged in
  useEffect(() => {
    async function register() {
      if (!isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently();

        await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("✓ User registered in backend");
      } catch (err) {
        console.error("Register error:", err);
      }
    }

    register();
  }, [isAuthenticated]);


  // Simple SPA navigation helper using the History API.
  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogin = () =>
    loginWithRedirect({
      appState: { returnTo: '/mainmenu' },
    });

  const handleSignup = () =>
    loginWithRedirect({
      appState: { returnTo: '/mainmenu' },
      authorizationParams: {
        screen_hint: 'signup',
        prompt: 'login', // force the form even if SSO exists (nice for testing)
      },
    });

  const handleLogout = () =>
    logout({
      logoutParams: { returnTo: window.location.origin },
      // federated: true, // uncomment if you also want to clear upstream IdP sessions during testing
    });

  const continueAsGuest = () => {
    localStorage.setItem('guest', 'true');
    navigate('/mainmenu');
  };

  // Shared button style (matches main menu design language)
  const primaryBtn = {
    padding: '1rem 1.6rem',
    borderRadius: '12px',
    border: 'none',
    background: '#ffffff',
    color: '#001f62',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 5px 14px rgba(0,0,0,0.35)',
  };
  const disabledStyle = isAuthenticated ? { opacity: 0.6, cursor: 'not-allowed' } : {};

  const ctaBtn = {
    ...primaryBtn,
    width: 'min(280px, 85vw)',
    fontSize: '1.1rem',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        background: '#001f62',
        color: '#fff',
        border: '3px solid red', // matching main menu border accent
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <HeaderBar title="UIC Wiki" />

      {/* Intro Section */}
      <section style={{ maxWidth: 900, textAlign: 'center', marginTop: '2.2rem', padding: '0 1rem' }}>
        <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800 }}>Welcome</h2>
        <p style={{ marginTop: '0.75rem', fontSize: '1.05rem', lineHeight: 1.5, opacity: 0.95 }}>
          Explore topics across the university. Browse as a guest or log in to create and share posts.
        </p>
      </section>

      {/* Central Action Buttons */}
      <div
        style={{
          marginTop: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {isAuthenticated ? (
          <button style={ctaBtn} onClick={() => navigate('/mainmenu')}>Go to Main Menu</button>
        ) : (
          <>
            {/* Top row: Login | Signup */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '1.2rem',
                width: 'min(700px, 92vw)',
              }}
            >
              <button style={{ ...ctaBtn, width: '100%' }} onClick={handleLogin}>Login</button>
              <button
                style={{ ...ctaBtn, width: '100%', ...disabledStyle }}
                onClick={handleSignup}
                disabled={isAuthenticated}
                title={isAuthenticated ? 'Already signed in' : undefined}
              >
                Signup
              </button>
            </div>
            {/* Bottom row: Continue as Guest (centered) */}
            <button style={ctaBtn} onClick={continueAsGuest}>Continue as Guest</button>
          </>
        )}
      </div>

      {/* Authenticated greeting */}
      {isAuthenticated && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', opacity: 0.9 }}>
            Welcome back, <strong>{user?.nickname || user?.email?.split('@')[0] || 'User'}</strong>!
          </p>
        </div>
      )}

      {/* Bottom-left: Browse Topics (consistent with main menu) */}
      <button
        onClick={() => navigate('/topicPage')}
        style={{
          position: 'fixed',
          left: '1rem',
          bottom: '1rem',
          ...primaryBtn,
        }}
      >
        Browse Topics
      </button>

      {/* Bottom-right: Login/Logout controls (aligned with main menu pattern) */}
      <div
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: '1rem',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'center',
        }}
      >
        {isAuthenticated ? (
          <button style={primaryBtn} onClick={handleLogout}>Logout</button>
        ) : (
          <button style={primaryBtn} onClick={handleLogin}>Login</button>
        )}
      </div>
    </main>
  );
}