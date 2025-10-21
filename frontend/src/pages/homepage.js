import React, { useEffect } from 'react';

export default function HomePage() {
    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.background = '#001f62';
        document.body.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", Helvetica, Arial, sans-serif';
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
        // Trigger the popstate listener in our tiny Router
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <main style={{ minHeight: '100vh', padding: '2rem', color: '#fff' }}>
            <nav id="banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/UICBanner.svg" alt="UIC Banner" style={{ height: '100px', marginRight: '1rem'  }} />
                    <h2 style={{ margin: 0, fontSize: '3rem', textAlign: 'center', width: '100%' }}>Welcome to the UIC Wiki Page</h2>
                </div>
            </nav>

            <div style={{ display: 'flex', gap: '5rem', marginTop: '10rem', justifyContent: 'center', alignItems: 'center' }}>
                <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate('/login')}>
                    Login
                </button>

                <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate('/mainmenu')}>
                    Guest
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '5rem', alignItems: 'center', justifyContent: 'center' }}>
                <button
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                        // action for the third button
                    }}
                >
                    Create a new account
                </button>
            </div>
        </main>
    );
}