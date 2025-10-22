// filepath: /Users/iancarlotrejo/IdeaProjects/CS351Group83/frontend/src/pages/topicPage.js
import React, { useEffect } from 'react';

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
    { label: 'General', tag: 'General' },
    { label: 'Events', tag: 'Events' },
    { label: 'Math', tag: 'Math' },
    { label: 'CS', tag: 'CS' },
    { label: 'Biology', tag: 'Biology' },
    { label: 'Chemistry', tag: 'Chem' },
    { label: 'English', tag: 'English' },
    { label: 'History', tag: 'History' },
    { label: 'Philosophy', tag: 'Philosophy' },
    { label: 'Career', tag: 'Career' },
  ];

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
    width: '100%',
  };

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar with back to main menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/mainmenu')}
          style={{ ...btn, width: 'auto', padding: '0.6rem 1rem' }}
        >
          ← Main Menu
        </button>
        <div />
      </div>

      {/* Header */}
      <header style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.6rem', lineHeight: 1.2 }}>Browse Topics</h1>
        <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Pick a topic to view or create posts.</p>
      </header>

      {/* Topics grid */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '3rem auto 0',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {topics.map((t) => (
            <button
              key={t.tag}
              style={btn}
              onClick={() => navigate(`/topic/${encodeURIComponent(t.tag)}`)}
              title={`Open ${t.label}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Footer banner pinned to bottom */}
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
          style={{ height: '140px', maxWidth: '95%', width: 'auto', objectFit: 'contain' }}
        />
      </footer>
    </main>
  );
}

