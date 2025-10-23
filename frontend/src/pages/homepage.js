import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function HomePage() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.background = '#001f62';
    document.body.style.fontFamily =
      'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", Helvetica, Arial, sans-serif';
    return () => {
      document.body.style.background = '';
      document.body.style.margin = '';
      document.body.style.fontFamily = '';
    };
  }, []);

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

  // button style
  const btn = {
    padding: '0.9rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 600,
    background: '#ffffff',
    color: '#001f62',
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  };
  const disabledStyle = isAuthenticated ? { opacity: 0.6, cursor: 'not-allowed' } : {};

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header (centered title) */}
      <header style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '3rem', lineHeight: 1.2 }}>Welcome to the UIC Wiki Page</h1>
        <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Find and share knowledge across UIC topics.</p>
      </header>

      {/* Top row: Login/Logout + Signup */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '4rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {isAuthenticated ? (
          <button style={btn} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button style={btn} onClick={handleLogin}>
            Login
          </button>
        )}

        <button
          style={{ ...btn, ...disabledStyle }}
          onClick={handleSignup}
          disabled={isAuthenticated}
          title={isAuthenticated ? 'Already signed in' : undefined}
        >
          Signup
        </button>
      </div>

      {/* Bottom area: Guest or Main Menu */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '3rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isAuthenticated ? (
          <button style={btn} onClick={() => navigate('/mainmenu')}>
            Main Menu
          </button>
        ) : (
          <button style={btn} onClick={continueAsGuest}>
            Continue as Guest
          </button>
        )}
      </div>

      {isAuthenticated && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Welcome back, {user?.nickname || user?.email?.split('@')[0] || 'User'}!</p>
        </div>
      )}

       {/*Footer banner pinned to bottom*/}
      <footer
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '2rem',
        }}
      >
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={{ height: '160px', maxWidth: '95%', width: 'auto', objectFit: 'contain' }}
        />
      </footer>
    </main>
  );
}
