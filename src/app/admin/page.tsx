'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

interface AdminDashboardData {
    totalShops: number;
    activeShops: number;
    totalOrders: number;
    totalRevenue: number;
    activeSubscriptions: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then((r) => r.json()),
            fetch('/api/dashboard').then((r) => r.json()),
        ])
            .then(([userData, dashData]) => {
                if (userData.data?.role !== 'SUPER_ADMIN') {
                    router.push('/shop');
                    return;
                }
                setUser(userData.data);
                setDashboard(dashData.data);
                setLoading(false);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    if (loading || !user || !dashboard) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pulse-glow" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar userName={user.name} role="SUPER_ADMIN" />

            <main style={{ flex: 1, marginLeft: 260, padding: '32px' }} className="responsive-main">
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                        Platform <span style={{ color: 'var(--accent)' }}>Overview</span> 🚀
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Monitor all cake shops across the platform.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 20,
                    marginBottom: 32,
                }}>
                    <StatCard title="Total Shops" value={dashboard.totalShops} icon="🏪" subtitle={`${dashboard.activeShops} active`} color="linear-gradient(135deg, #60a5fa, #3b82f6)" />
                    <StatCard title="Total Orders" value={dashboard.totalOrders} icon="📋" color="linear-gradient(135deg, #a78bfa, #7c3aed)" />
                    <StatCard title="Platform Revenue" value={formatCurrency(dashboard.totalRevenue)} icon="💰" color="linear-gradient(135deg, #4ade80, #22c55e)" />
                    <StatCard title="Active Subscriptions" value={dashboard.activeSubscriptions} icon="💳" color="linear-gradient(135deg, #fbbf24, #f59e0b)" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button onClick={() => router.push('/admin/shops')} className="btn-secondary" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span>🏪</span> Manage Shops
                            </button>
                            <button onClick={() => router.push('/admin/subscriptions')} className="btn-secondary" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span>💳</span> Manage Subscriptions
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>System Info</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Inactive Shops</span>
                                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{dashboard.totalShops - dashboard.activeShops}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Platform Version</span>
                                <span style={{ fontWeight: 600 }}>v1.0.0</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Environment</span>
                                <span className="badge badge-ready">Production</span>
                            </div>
                        </div>
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
