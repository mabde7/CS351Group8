'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../../components/HeaderBar';

export default function TopicDetail({ params }) {
  const router = useRouter();
  const navigate = (to) => { if (window.location.pathname !== to) router.push(to); };
  const tag = decodeURIComponent(params?.tag || 'General');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title={`Topic: ${tag}`} />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="font-medium">Browsing topic</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">{tag}</h1>
          <p className="mt-3 text-slate-300">Here you can view posts and resources related to {tag}.</p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button onClick={() => navigate('/topicPage')} className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition">All Topics</button>
          <button onClick={() => navigate('/mainmenu')} className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition">Main Menu</button>
          <button onClick={() => navigate('/')} className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#001f62] shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition">Home</button>
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <img src="/UICBanner.svg" alt="UIC Banner" className="mx-auto h-24 w-auto object-contain opacity-90" />
        </div>
      </footer>
    </main>
  );
}

