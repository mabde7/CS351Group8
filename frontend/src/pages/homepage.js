import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import HeaderBar from '../components/HeaderBar';

export default function HomePage() {
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    document.body.style.margin = '0';
    return () => {
      document.body.style.margin = '';
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeaderBar title="UIC Wiki" />
        </div>
      </div>

      <section className="relative isolate">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pt-16 pb-10 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">Explore, share, and collaborate</span>
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">Welcome to UIC Wiki</h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl">
                Discover topics across the university. Browse as a guest or log in to create and share posts with your peers.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
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

            <div className="lg:col-span-5 relative">
              <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.12),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)]" />
                <img
                  src="/UICBanner.svg"
                  alt="UIC Banner"
                  className="mx-auto h-32 w-auto object-contain opacity-90"
                />
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-800/60 p-4 border border-slate-700">
                    <p className="text-sm text-slate-300">Create</p>
                    <p className="mt-1 text-xl font-bold text-white">Posts</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-4 border border-slate-700">
                    <p className="text-sm text-slate-300">Browse</p>
                    <p className="mt-1 text-xl font-bold text-white">Topics</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-4 border border-slate-700">
                    <p className="text-sm text-slate-300">Connect with</p>
                    <p className="mt-1 text-xl font-bold text-white">Peers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
              <h3 className="text-lg font-semibold text-white">Discover</h3>
              <p className="mt-2 text-sm text-slate-300">
                Find posts by tags and recent activity from the community.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
              <h3 className="text-lg font-semibold text-white">Contribute</h3>
              <p className="mt-2 text-sm text-slate-300">
                Create posts to share knowledge and help fellow students.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
              <h3 className="text-lg font-semibold text-white">Collaborate</h3>
              <p className="mt-2 text-sm text-slate-300">
                Engage with peers and build a shared resource for UIC.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-sm shadow-emerald-500/30 ring-1 ring-inset ring-emerald-400 hover:bg-emerald-600 transition"
              onClick={() => navigate('/mainmenu')}
            >
              Explore the Wiki
            </button>
            {!isAuthenticated && (
              <button
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-inset ring-blue-500 hover:bg-blue-700 transition"
                onClick={handleSignup}
              >
                Create an Account
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400">
          <p className="text-sm">© {new Date().getFullYear()} UIC Wiki. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
