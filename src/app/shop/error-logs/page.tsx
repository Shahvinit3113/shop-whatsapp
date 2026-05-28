'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { format } from 'date-fns';

interface ErrorLog {
    id: string;
    errorType: string;
    message: string;
    stack?: string;
    createdAt: string;
}

export default function ErrorLogsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shopId: string; shopName?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ErrorLog[]>([]);

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.data?.role !== 'SHOP_ADMIN') {
                    router.push('/login');
                    return;
                }
                setUser(data.data);
                return fetchLogs();
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/error-logs');
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch error logs', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pulse-glow" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar userName={user.name} shopName={user.shopName} role="SHOP_ADMIN" />

            <main style={{ flex: 1, marginLeft: 260, padding: 32 }} className="responsive-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>⚠️ <span style={{ color: 'var(--accent)' }}>Error Logs</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>System errors related to your shop</p>
                    </div>
                    <button onClick={fetchLogs} className="btn-secondary">
                        Refresh
                    </button>
                </div>

                <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            No errors found. Everything is running smoothly! 🎉
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Time</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Error Type</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                                        <td style={{ padding: '16px', whiteSpace: 'nowrap', fontSize: 14 }}>
                                            {format(new Date(log.createdAt), 'MMM d, yyyy, h:mm a')}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: 14 }}>
                                            <span style={{
                                                background: 'var(--danger)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                fontSize: 12
                                            }}>
                                                {log.errorType}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: 14, color: 'var(--text-primary)' }}>
                                            {log.message}
                                            {log.stack && (
                                                <pre style={{
                                                    marginTop: '8px',
                                                    padding: '12px',
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: '6px',
                                                    fontSize: 12,
                                                    overflowX: 'auto',
                                                    color: 'var(--text-muted)',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    {log.stack}
                                                </pre>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            <style jsx>{`
        @media (max-width: 768px) {
          .responsive-main { margin-left: 0 !important; padding: 72px 16px 16px !important; }
        }
      `}</style>
        </div>
    );
}
