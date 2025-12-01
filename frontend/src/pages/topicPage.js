import React, { useEffect } from 'react';
import HeaderBar from '../components/HeaderBar';

export default function TopicBrowse() {
  // Remove previous body style side-effects; keep margin reset if needed
  useEffect(() => {
    document.body.style.margin = '0';
    return () => { document.body.style.margin = ''; };
  }, []);

  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const topics = [
    'General', 'Events', 'Math', 'CS', 'Biology', 'Chem', 'English', 'History', 'Philosophy', 'Career'
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title="Browse Topics" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="font-medium">Choose a subject to explore posts</span>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">Pick a Topic</h2>
        <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">Select a topic to view existing posts or create new ones that contribute to the UIC Wiki.</p>
      </section>

      {/* Topics Grid */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {topics.map(tag => (
            <button
              key={tag}
              onClick={() => navigate(`/topic/${encodeURIComponent(tag)}`)}
              title={`Open ${tag}`}
              className="group relative w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition flex items-center justify-between overflow-hidden"
            >
              <span className="truncate">{tag}</span>
              <span className="ml-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition">Open</span>
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-emerald-400/60 transition" />
            </button>
          ))}
        </div>
      </section>

      {/* Floating Nav Buttons */}
      <div className="fixed left-4 bottom-4 flex flex-col gap-3">
        <button
          onClick={() => navigate('/mainmenu')}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
        >
          ← Main Menu
        </button>
      </div>
      <div className="fixed right-4 bottom-4 flex flex-col gap-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
        >
          Home
        </button>
      </div>

      {/* Footer Banner */}
      <footer className="mt-auto border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-center">
          <img src="/UICBanner.svg" alt="UIC Banner" className="mx-auto h-24 w-auto object-contain opacity-90" />
        </div>
      </footer>
    </main>
  );
}
