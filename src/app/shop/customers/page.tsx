'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Customer {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
    recentOrders?: Array<{
        id: string;
        orderNumber: string;
        totalAmount: number;
        status: string;
    }>;
}

export default function CustomersPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shop?: { name: string } } | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchCustomers = async () => {
        const res = await fetch(`/api/customers?search=${search}&limit=50`);
        const data = await res.json();
        if (data.success) setCustomers(data.data.data);
    };

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json())
            .then((data) => { setUser(data.data); return fetchCustomers(); })
            .then(() => setLoading(false))
            .catch(() => router.push('/login'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
        const method = editingId ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        setShowModal(false);
        setEditingId(null);
        setForm({ name: '', phone: '' });
        setSaving(false);
        fetchCustomers();
    };

    const handleEdit = (customer: Customer) => {
        setEditingId(customer.id);
        setForm({ name: customer.name, phone: customer.phone });
        setShowModal(true);
    };

    if (loading || !user) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pulse-glow" style={{ width: 40, height: 40 }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar userName={user.name} shopName={user.shop?.name} role="SHOP_ADMIN" />

            <main style={{ flex: 1, marginLeft: 260, padding: 32 }} className="responsive-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>👥 <span style={{ color: 'var(--accent)' }}>Customers</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{customers.length} registered customers</p>
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setForm({ name: '', phone: '' }); setShowModal(true); }}
                        className="btn-primary"
                    >
                        + Add Customer
                    </button>
                </div>

                <input
                    type="text"
                    className="input-field"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 24, maxWidth: 400 }}
                />

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th className="hide-mobile">Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    background: 'var(--accent)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{customer.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{customer.phone}</td>
                                        <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td>
                                            <button onClick={() => handleEdit(customer)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            No customers yet. Add your first customer!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                            {editingId ? 'Edit Customer' : 'Add New Customer'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Name</label>
                                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Customer name" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Phone</label>
                                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="9876543210" />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        @media (max-width: 768px) {
          .responsive-main { margin-left: 0 !important; padding: 72px 16px 16px !important; }
        }
      `}</style>
        </div>
    );
}
