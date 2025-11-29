import React, { useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';

export default function TopicBrowse() {
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

  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const topics = [
    'General', 'Events', 'Math', 'CS', 'Biology', 'Chem', 'English', 'History', 'Philosophy', 'Career'
  ];

  const topicBtn = {
    padding: '1rem',
    width: '100%',
    borderRadius: '10px',
    border: 'none',
    background: '#ffffff',
    color: '#001f62',
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
    boxShadow: '0 5px 14px rgba(0,0,0,0.35)',
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
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <HeaderBar title="Browse Topics" />

      <section style={{ maxWidth: 900, textAlign: 'center', marginTop: '2.2rem', padding: '0 1rem' }}>
        <h2 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 800 }}>Pick a Topic</h2>
        <p style={{ marginTop: '0.75rem', fontSize: '1.02rem', lineHeight: 1.5, opacity: 0.95 }}>
          Choose a subject area to view existing posts or create new ones.
        </p>
      </section>

      {/* Topic grid */}
      <section
        style={{
          maxWidth: 1100,
          width: '100%',
          marginTop: '2.8rem',
          padding: '0 1rem',
          paddingBottom: '8rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {topics.map(tag => (
            <button
              key={tag}
              style={topicBtn}
              onClick={() => navigate(`/topic/${encodeURIComponent(tag)}`)}
              title={`Open ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Floating buttons */}
      <button
        onClick={() => navigate('/mainmenu')}
        style={{
          position: 'fixed',
          left: '1rem',
          bottom: '1rem',
          padding: '1rem 1.6rem',
          borderRadius: '12px',
          border: 'none',
          background: '#ffffff',
          color: '#001f62',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 5px 14px rgba(0,0,0,0.35)',
        }}
      >
        ← Main Menu
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: '1rem',
          padding: '1rem 1.6rem',
          borderRadius: '12px',
          border: 'none',
          background: '#ffffff',
          color: '#001f62',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 5px 14px rgba(0,0,0,0.35)',
        }}
      >
        Home
      </button>

      {/* 🔵 Footer Banner */}
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
