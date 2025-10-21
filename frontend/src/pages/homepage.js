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

  // shared button style + disabled style
  const btn = {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  };
  const disabledStyle = isAuthenticated ? { opacity: 0.6, cursor: 'not-allowed' } : {};

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      <nav
        id="banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/UICBanner.svg" alt="UIC Banner" style={{ height: '100px', marginRight: '1rem' }} />
          <h2 style={{ margin: 0, fontSize: '3rem', textAlign: 'center', width: '100%' }}>
            Welcome to the UIC Wiki Page
          </h2>
        </div>
      </nav>

      {/* Top row: Login/Logout + Signup */}
      <div
        style={{
          display: 'flex',
          gap: '5rem',
          marginTop: '10rem',
          justifyContent: 'center',
          alignItems: 'center',
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

      {/* Bottom area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '5rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
         {isAuthenticated ? (
          <button style={btn} onClick={navigate('/mainmenu')}>
            Main Menu
          </button>
        ) : (
          <button style={btn} onClick={continueAsGuest}>
            Guest
          </button>
        )}
      </div>

      {isAuthenticated && (
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p>Welcome back, {(user?.nickname || user?.email?.split('@')[0] || 'User')}!</p>
        </div>
      )}
    </main>
  );
}
