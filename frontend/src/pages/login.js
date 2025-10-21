import React, { useEffect, useState } from 'react';

export default function LoginPage() {
    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.background = '#001f62';
        return () => {
            document.body.style.margin = '';
            document.body.style.background = '';
        };
    }, []);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!email || !password) return 'Email and password are required';
        if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (v) return setError(v);
        setError('');
        setLoading(true);
        try {
            await new Promise((res) => setTimeout(res, 600));
            window.location.href = '/';
        } catch {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        main: { minHeight: '100vh', padding: '2rem', color: '#fff' },
        nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem' },
        formWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '6rem' },
        card: { background: 'rgba(255,255,255,0.06)', padding: '2rem', borderRadius: 8, width: 360, boxShadow: '0 6px 18px rgba(0,0,0,0.5)' },
        input: { width: '100%', padding: '0.6rem 0.75rem', margin: '0.25rem 0 0.75rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff' },
        label: { fontSize: '0.9rem' },
        button: { width: '100%', padding: '0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#0a58ca', color: '#fff', fontWeight: 600 },
        error: { background: '#ffdddd', color: '#6b0000', padding: '0.5rem', borderRadius: 6, marginBottom: '0.75rem' },
        hint: { marginTop: '0.75rem', fontSize: '0.9rem', textAlign: 'center', opacity: 0.9 },
        img: { height: 100, marginRight: '1rem' },
        heading: { margin: 0, fontSize: '2rem', textAlign: 'left' }
    };

    return (
        <main style={styles.main}>
            <nav id="banner" style={styles.nav}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/UICBanner.svg" alt="UIC Banner" style={styles.img} />
                    <h2 style={styles.heading}>Sign in to the UIC Wiki Page</h2>
                </div>
            </nav>

            <div style={styles.formWrapper}>
                <div style={styles.card}>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#fff' }}>Welcome back</h3>

                    {error && <div style={styles.error}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <label style={styles.label} htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="username"
                            style={styles.input}
                        />

                        <label style={styles.label} htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            style={styles.input}
                        />

                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div style={styles.hint}>
                        <div>
                            Don’t have an account?{' '}
                            <a href="/" style={{ color: '#fff', textDecoration: 'underline' }}>Go to Home</a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}