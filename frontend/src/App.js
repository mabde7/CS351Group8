import './App.css';
import HomePage from './pages/homepage';
import LoginPage from './pages/login';
import TopicPage from './pages/topic';
import React, { useEffect, useState } from 'react';
import MainMenu from './pages/mainmenu';
import TopicBrowse from './pages/topicPage';

// Tiny client-side router using the History API so we don't need react-router-dom.
function Router() {
  const [path, setPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path === '/login') return <LoginPage />;
  if (path === '/mainmenu' || path === '/main') return <MainMenu />;
  if (path === '/topicPage') return <TopicBrowse />;
  if (path.startsWith("/topic/")) {
    const tag = decodeURIComponent(path.replace("/topic/", ""));
    return <TopicPage topic={tag} />;
  }
  // Add other routes here as needed (e.g. /guest, /signup)
  return <HomePage />;
}

function App() {
  return (
    <div className="App">
      <Router />
    </div>
  );
}

export default App;
