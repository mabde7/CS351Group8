// frontend/src/App.js
import './App.css';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import HomePage from './pages/homepage';
import LoginPage from './pages/login';
import TopicPage from './pages/topic';
import MainMenu from './pages/mainmenu';
import TopicBrowse from './pages/topicPage'; // your "Browse topics" page
import { getOrCreateUserKey } from './utils/userKey';

const API_BASE = "http://localhost:5000"; // adjust if needed

function Router() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { isAuthenticated, user } = useAuth0();
  const [userKey, setUserKey] = useState(null);

  // Build userKey whenever auth state changes
  useEffect(() => {
    setUserKey(getOrCreateUserKey(isAuthenticated, user));
  }, [isAuthenticated, user]);

  // keep router in sync with back/forward
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Record recent topics whenever we hit /topic/<tag>
  const lastRecorded = useRef({ tag: null, key: null });

  useEffect(() => {
    if (!userKey) return;
    if (!path.startsWith('/topic/')) return;

    const tag = decodeURIComponent(path.replace('/topic/', ''));
    if (!tag) return;

    // avoid re-posting the same tag for the same userKey on trivial re-renders
    const signatureChanged = (
      lastRecorded.current.tag !== tag || lastRecorded.current.key !== userKey
    );
    if (!signatureChanged) return;

    (async () => {
      try {
        await fetch(`${API_BASE}/api/recent-topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: userKey, tag }),
        });
      } catch {
        // ignore errors; viewing still works
      } finally {
        lastRecorded.current = { tag, key: userKey };
      }
    })();
  }, [path, userKey]);

  // Routes
  if (path === '/login') return <LoginPage />;
  if (path === '/mainmenu' || path === '/main') return <MainMenu />;
  if (path === '/topicPage') return <TopicBrowse />;

  if (path.startsWith('/topic/')) {
    const tag = decodeURIComponent(path.replace('/topic/', ''));
    return <TopicPage topic={tag} />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <div className="App">
      <Router />
    </div>
  );
}
