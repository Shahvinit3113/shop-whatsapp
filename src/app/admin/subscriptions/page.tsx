'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Subscription {
    id: string;
    shopId: string;
    planType: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    shop: { id: string; name: string } | null;
}

export default function AdminSubscriptionsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then((r) => r.json()),
            fetch('/api/subscriptions?limit=50').then((r) => r.json()),
        ])
            .then(([userData, subData]) => {
                if (userData.data?.role !== 'SUPER_ADMIN') { router.push('/shop'); return; }
                setUser(userData.data);
                setSubscriptions(subData.data?.data || []);
                setLoading(false);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const planColors: Record<string, string> = {
        FREE: 'badge-new',
        BASIC: 'badge-confirmed',
        PREMIUM: 'badge-preparing',
        ENTERPRISE: 'badge-ready',
    };

    if (loading || !user) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pulse-glow" style={{ width: 40, height: 40 }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar userName={user.name} role="SUPER_ADMIN" />

            <main style={{ flex: 1, marginLeft: 260, padding: 32 }} className="responsive-main">
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>💳 <span style={{ color: 'var(--accent)' }}>Subscriptions</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage shop subscription plans</p>
                </div>

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td style={{ fontWeight: 600 }}>{sub.shop?.name || 'Unknown'}</td>
                                        <td><span className={`badge ${planColors[sub.planType] || ''}`}>{sub.planType}</span></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(sub.startDate).toLocaleDateString('en-IN')}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN') : '—'}</td>
                                        <td><span className={`badge ${sub.isActive ? 'badge-ready' : 'badge-cancelled'}`}>{sub.isActive ? 'Active' : 'Expired'}</span></td>
                                    </tr>
                                ))}
                                {subscriptions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            No subscriptions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
