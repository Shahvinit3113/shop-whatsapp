'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

interface DashboardData {
    todaysOrderCount: number;
    monthlyRevenue: number;
    pendingPayments: {
        amount: number;
        count: number;
    };
    totalCustomers: number;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        totalAmount: number;
        status: string;
        paymentStatus: string;
        orderDate: string;
        customer: { name: string; phone: string } | null;
    }>;
    ordersByStatus: Record<string, number>;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'SHOP_ADMIN';
    shopId?: string;
    shop?: {
        id: string;
        name: string;
        whatsappPhoneNumberId?: string | null;
        whatsappAccessToken?: string | null;
    };
}

export default function ShopDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then((r) => r.json()),
            fetch('/api/dashboard').then((r) => r.json()),
        ])
            .then(([userData, dashData]) => {
                if (userData.data?.role === 'SUPER_ADMIN') {
                    router.push('/admin');
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
            <Sidebar userName={user.name} shopName={user.shop?.name} role="SHOP_ADMIN" />

            <main style={{
                flex: 1,
                marginLeft: 260,
                padding: '24px',
            }} className="responsive-main">
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span style={{ color: 'var(--accent)' }}>{user.name.split(' ')[0]}</span>! 👋
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Here&apos;s what&apos;s happening at {user.shop?.name || 'your shop'} today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 20,
                    marginBottom: 32,
                }}>
                    <StatCard
                        title="Today's Orders"
                        value={dashboard.todaysOrderCount}
                        icon="📋"
                        subtitle="orders placed today"
                        color="linear-gradient(135deg, #60a5fa, #3b82f6)"
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={formatCurrency(dashboard.monthlyRevenue)}
                        icon="💰"
                        subtitle="this month"
                        color="linear-gradient(135deg, #4ade80, #22c55e)"
                    />
                    <StatCard
                        title="Pending Payments"
                        value={formatCurrency(dashboard.pendingPayments.amount)}
                        icon="⏳"
                        subtitle={`${dashboard.pendingPayments.count} orders pending`}
                        color="linear-gradient(135deg, #fbbf24, #f59e0b)"
                    />
                    <StatCard
                        title="Total Customers"
                        value={dashboard.totalCustomers}
                        icon="👥"
                        subtitle="registered customers"
                        color="linear-gradient(135deg, #a78bfa, #7c3aed)"
                    />
                </div>

                {/* Order Status Overview */}
                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order Status Overview</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {Object.entries(dashboard.ordersByStatus).map(([status, count]) => (
                            <div key={status} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 16px',
                                borderRadius: 8,
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                            }}>
                                <StatusBadge status={status} />
                                <span style={{ fontWeight: 700, fontSize: 18 }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* WhatsApp Settings */}
                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>WhatsApp Integration 📱</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Phone Number ID</label>
                            <input
                                type="text"
                                defaultValue={user.shop?.whatsappPhoneNumberId || ''}
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    await fetch(`/api/shops/${user.shop?.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ whatsappPhoneNumberId: val })
                                    });
                                }}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                }}
                                placeholder="Your WhatsApp Phone Number ID"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Access Token</label>
                            <input
                                type="password"
                                defaultValue={user.shop?.whatsappAccessToken || ''}
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    await fetch(`/api/shops/${user.shop?.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ whatsappAccessToken: val })
                                    });
                                }}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                }}
                                placeholder="WhatsApp Cloud API Access Token"
                            />
                        </div>
                    </div>
                    <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        Find these in your Meta Developers Portal. Webhook URL: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : ''}</code>
                    </p>
                </div>

                {/* Recent Orders */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Orders</h2>
                        <button
                            onClick={() => router.push('/shop/orders')}
                            className="btn-secondary"
                            style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                            View All →
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th className="hide-mobile">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.recentOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/shop/orders/${order.id}`)}
                                    >
                                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                            {order.orderNumber}
                                        </td>
                                        <td>{order.customer?.name || 'Unknown'}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                                        <td><StatusBadge status={order.status} /></td>
                                        <td><StatusBadge status={order.paymentStatus} type="payment" /></td>
                                        <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(order.orderDate).toLocaleDateString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                                {dashboard.recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            No orders yet. Create your first order!
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
          .responsive-main {
            margin-left: 0 !important;
            padding: 72px 16px 16px !important;
          }
        }
      `}</style>
        </div>
    );
}
