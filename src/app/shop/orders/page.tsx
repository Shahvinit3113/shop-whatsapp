'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';

interface Order {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    orderDate: string;
    customer: { name: string; phone: string } | null;
}

export default function OrdersPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shop?: { name: string } } | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async () => {
        const params = new URLSearchParams({ page: String(page), limit: '15' });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();
        if (data.success) {
            setOrders(data.data.data);
            setTotalPages(data.data.pagination.totalPages);
        }
    };

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json())
            .then((data) => {
                setUser(data.data);
                return fetchOrders();
            })
            .then(() => setLoading(false))
            .catch(() => router.push('/login'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchOrders();
    };

    const getNextStatus = (status: string): string | null => {
        const map: Record<string, string> = {
            NEW: 'CONFIRMED',
            CONFIRMED: 'PREPARING',
            PREPARING: 'READY',
            READY: 'DELIVERED',
        };
        return map[status] || null;
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const statuses = ['', 'NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

    if (loading || !user) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pulse-glow" style={{ width: 40, height: 40 }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
            <Sidebar userName={user.name} shopName={user.shop?.name} role="SHOP_ADMIN" />

            <main style={{ flex: 1, overflowX: 'hidden' }} className="responsive-main orders-main">
                <div className="orders-header">
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>📋 <span className="gradient-text">Orders</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your cake orders</p>
                    </div>
                    <button onClick={() => router.push('/shop/orders/new')} className="btn-primary">
                        + New Order
                    </button>
                </div>

                {/* Status Filters */}
                <div className="status-filters">
                    {statuses.map((s) => (
                        <button
                            key={s || 'all'}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`status-filter-btn ${statusFilter === s ? 'active' : ''}`}
                        >
                            {s || 'All'}
                        </button>
                    ))}
                </div>

                {/* Orders Table — Desktop */}
                <div className="glass-card orders-table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
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
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const nextStatus = getNextStatus(order.status);
                                    return (
                                        <tr key={order.id}>
                                            <td
                                                style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}
                                                onClick={() => router.push(`/shop/orders/${order.id}`)}
                                            >
                                                {order.orderNumber}
                                            </td>
                                            <td>
                                                <div>{order.customer?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.customer?.phone}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                                            <td><StatusBadge status={order.status} /></td>
                                            <td><StatusBadge status={order.paymentStatus} type="payment" /></td>
                                            <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                {new Date(order.orderDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {nextStatus && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                                            className="btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: 11, whiteSpace: 'nowrap' }}
                                                        >
                                                            → {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                                                        </button>
                                                    )}
                                                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                                            className="btn-danger"
                                                            style={{ padding: '6px 12px', fontSize: 11 }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            No orders found. Create your first order!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Orders Cards — Mobile */}
                <div className="orders-card-list">
                    {orders.map((order) => {
                        const nextStatus = getNextStatus(order.status);
                        return (
                            <div key={order.id} className="glass-card order-card">
                                <div className="order-card-header" onClick={() => router.push(`/shop/orders/${order.id}`)}>
                                    <span className="order-card-number" style={{ color: 'var(--accent)' }}>{order.orderNumber}</span>
                                    <span className="order-card-amount">{formatCurrency(order.totalAmount)}</span>
                                </div>
                                <div className="order-card-customer">
                                    {order.customer?.name || 'Unknown'}
                                    {order.customer?.phone && <span className="order-card-phone"> · {order.customer.phone}</span>}
                                </div>
                                <div className="order-card-badges">
                                    <StatusBadge status={order.status} />
                                    <StatusBadge status={order.paymentStatus} type="payment" />
                                </div>
                                <div className="order-card-date">
                                    {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                {(nextStatus || (order.status !== 'CANCELLED' && order.status !== 'DELIVERED')) && (
                                    <div className="order-card-actions">
                                        {nextStatus && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                                className="btn-primary"
                                                style={{ padding: '8px 16px', fontSize: 12, flex: 1 }}
                                            >
                                                → {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                                            </button>
                                        )}
                                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                                className="btn-danger"
                                                style={{ padding: '8px 16px', fontSize: 12 }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            No orders found. Create your first order!
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="orders-pagination">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>← Prev</button>
                        <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Next →</button>
                    </div>
                )}
            </main>


        </div>
    );
}
