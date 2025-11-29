import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import HeaderBar from '../../components/HeaderBar';

export default function HomePage() {
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0();

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

  // navigation helper
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
        prompt: 'login',
      },
    });

  const handleLogout = () =>
    logout({ logoutParams: { returnTo: window.location.origin } });

  const continueAsGuest = () => {
    localStorage.setItem('guest', 'true');
    navigate('/mainmenu');
  };

  // Shared button style
  const ctaBtn = {
    padding: '1.1rem 1.6rem',
    borderRadius: '12px',
    border: 'none',
    background: '#ffffff',
    color: '#001f62',
    fontWeight: 700,
    fontSize: '1.15rem',
    cursor: 'pointer',
    width: 'min(420px, 90vw)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        background: '#001f62',
        color: '#fff',
        border: '3px solid red',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <HeaderBar title="UIC Wiki" />

      <section style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ margin: 0, fontSize: '2.6rem', fontWeight: 800 }}>Welcome</h2>
        <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.9, maxWidth: 700 }}>
          Explore topics across the university. Browse as a guest or log in to create and share posts.
        </p>
      </section>

      {/* Central login/signup/guest buttons */}
      <div
        style={{
          marginTop: '4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.6rem',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {isAuthenticated ? (
          <>
            <button style={ctaBtn} onClick={() => navigate('/mainmenu')}>
              Go to Main Menu
            </button>
            <button style={ctaBtn} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button style={ctaBtn} onClick={handleLogin}>Login</button>
            <button style={ctaBtn} onClick={handleSignup}>Signup</button>
            <button style={ctaBtn} onClick={continueAsGuest}>Continue as Guest</button>
          </>
        )}
      </div>

      {isAuthenticated && (
        <div style={{ marginTop: '1.8rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', opacity: 0.9 }}>
            Welcome back, <strong>{user?.nickname || user?.email?.split('@')[0] || 'User'}</strong>!
          </p>
        </div>
      )}

      {/* Footer banner — always pinned bottom */}
      <footer
        style={{
          marginTop: 'auto',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem 0',
        }}
      >
        <img
          src="/UICBanner.svg"
          alt="UIC Banner"
          style={{
            height: '150px',
            maxWidth: '95%',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </footer>
    </main>
  );
}
