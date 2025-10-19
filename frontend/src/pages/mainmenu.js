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
                    <img src="/UICBanner.svg" alt="UIC Banner" style={{ height: '100px', marginRight: '1rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '3rem', lineHeight: 1 }}>Main menu</h2>

                    </div>
                </div>
            </nav>


            <p style={{ margin: 0, fontSize: '3rem', opacity: 0.9 }}>recent searches</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '4rem', alignItems: 'center',
                justifyContent: 'center',}}>


              <button
                style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', width: '220px' }}
                onClick={() => {

                }}
              >
                  CS 377
              </button>

              <button
                style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', width: '220px' }}
                onClick={() => {

                }}
              >
                  CS 341
              </button>

              <button
                style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', width: '220px' }}
                onClick={() => {

                }}
              >
                CS 351
              </button>

              <button
                style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', width: '220px' }}
                onClick={() => {

                }}
            >
                CS 351
            </button>

            <button
                style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', width: '220px' }}
                onClick={() => {

                }}
            >
                CS 361
            </button>
            </div>


        </main>
    );
}