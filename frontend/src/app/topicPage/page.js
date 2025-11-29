'use client';

import React from 'react';
import HeaderBar from '../components/HeaderBar';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';

export default function TopicBrowse() {
  const router = useRouter();
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const navigate = (to) => {
    if (window.location.pathname === to) return;
    router.push(to);
  };

  const handleLogin = () => loginWithRedirect({ appState: { returnTo: '/mainmenu' } });
  const handleSignup = () => loginWithRedirect({ appState: { returnTo: '/mainmenu' }, authorizationParams: { screen_hint: 'signup', prompt: 'login' } });
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });
  const continueAsGuest = () => { localStorage.setItem('guest', 'true'); navigate('/mainmenu'); };

  const topics = [
    'General', 'Events', 'Math', 'CS', 'Biology', 'Chem', 'English', 'History', 'Philosophy', 'Career'
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title="Browse Topics" />
        </div>
      </div>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="font-medium">Choose a subject to explore or post</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">Pick a Topic</h1>
          <p className="mt-3 text-slate-300">Choose a subject area to view existing posts or create new ones.</p>

          {/* Auth CTAs to match homepage functionality */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-sm shadow-emerald-500/30 ring-1 ring-inset ring-emerald-400 hover:bg-emerald-600 transition"
                  onClick={() => navigate('/mainmenu')}
                >
                  Go to Main Menu
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-5 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-600 transition"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-sm shadow-emerald-500/30 ring-1 ring-inset ring-emerald-400 hover:bg-emerald-600 transition"
                  onClick={handleLogin}
                >
                  Login
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-inset ring-blue-500 hover:bg-blue-700 transition"
                  onClick={handleSignup}
                >
                  Signup
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-5 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-600 transition"
                  onClick={continueAsGuest}
                >
                  Continue as Guest
                </button>
              </>
            )}
          </div>

          {isAuthenticated && (
            <p className="mt-4 text-sm text-slate-300">
              Welcome back, <span className="font-semibold text-white">{user?.nickname || user?.email?.split('@')[0] || 'User'}</span>!
            </p>
          )}
        </div>

        {/* Topics grid (centered, constrained) */}
        <div className="mt-8 mx-auto w-full max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/topic/${encodeURIComponent(tag)}`)}
                title={`Open ${tag}`}
                className="w-full rounded-xl bg-white/95 text-[#001f62] font-semibold px-5 py-4 shadow-lg ring-1 ring-slate-200 hover:bg-white transition flex items-center justify-between"
              >
                <span>{tag}</span>
                <span className="ml-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">Open</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/mainmenu')}
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
          >
            ← Main Menu
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition"
          >
            Home
          </button>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="mt-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <img src="/UICBanner.svg" alt="UIC Banner" className="mx-auto h-24 w-auto object-contain opacity-90" />
        </div>
      </footer>
    </main>
  );
}
