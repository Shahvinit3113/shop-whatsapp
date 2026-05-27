'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            if (data.data.user.role === 'SUPER_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/shop');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: 16,
        }}>

            <div className="animate-in" style={{ maxWidth: 420, width: '100%' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        background: 'var(--accent)',
                        marginBottom: 20,
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
                    }}>
                        <span style={{ fontSize: 36 }}>🎂</span>
                    </div>
                    <h1 style={{
                        fontSize: 28,
                        fontWeight: 800,
                        marginBottom: 8,
                    }}>
                        <span className="gradient-text">CakeShop Pro</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Order Management System
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card" style={{ padding: 32 }}>
                    <h2 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 24,
                        textAlign: 'center',
                    }}>
                        Welcome Back
                    </h2>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(248, 113, 113, 0.1)',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            color: '#f87171',
                            fontSize: 14,
                            marginBottom: 20,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 8,
                            }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 8,
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                fontSize: 16,
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Demo credentials */}
                <div style={{
                    marginTop: 24,
                    padding: 20,
                    borderRadius: 12,
                    background: 'rgba(96, 165, 250, 0.05)',
                    border: '1px solid rgba(96, 165, 250, 0.15)',
                }}>
                    <p style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#60a5fa',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        Demo Credentials
                    </p>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        <div><strong>Super Admin:</strong> admin@cakeshop.com / admin123</div>
                        <div><strong>Shop Admin:</strong> sweet@cakeshop.com / shop123</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
