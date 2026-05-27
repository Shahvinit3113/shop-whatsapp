'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Cake {
    id: string;
    name: string;
    price: number;
    description: string;
    isActive: boolean;
    createdAt: string;
}

export default function CakesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shop?: { name: string } } | null>(null);
    const [cakes, setCakes] = useState<Cake[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCake, setEditingCake] = useState<Cake | null>(null);
    const [form, setForm] = useState({ name: '', price: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const fetchCakes = async () => {
        const res = await fetch(`/api/cakes?search=${search}&limit=50`);
        const data = await res.json();
        if (data.success) setCakes(data.data.data);
    };

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json())
            .then((data) => {
                setUser(data.data);
                return fetchCakes();
            })
            .then(() => setLoading(false))
            .catch(() => router.push('/login'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) fetchCakes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const url = editingCake ? `/api/cakes/${editingCake.id}` : '/api/cakes';
        const method = editingCake ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name,
                price: parseFloat(form.price),
                description: form.description,
            }),
        });

        setShowModal(false);
        setEditingCake(null);
        setForm({ name: '', price: '', description: '' });
        setSaving(false);
        fetchCakes();
    };

    const handleEdit = (cake: Cake) => {
        setEditingCake(cake);
        setForm({ name: cake.name, price: String(cake.price), description: cake.description || '' });
        setShowModal(true);
    };

    const handleToggle = async (cake: Cake) => {
        await fetch(`/api/cakes/${cake.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !cake.isActive }),
        });
        fetchCakes();
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

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
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🎂 <span style={{ color: 'var(--accent)' }}>Cake Menu</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{cakes.length} items in your menu</p>
                    </div>
                    <button
                        onClick={() => { setEditingCake(null); setForm({ name: '', price: '', description: '' }); setShowModal(true); }}
                        className="btn-primary"
                    >
                        + Add Cake
                    </button>
                </div>

                <input
                    type="text"
                    className="input-field"
                    placeholder="Search cakes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 24, maxWidth: 400 }}
                />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20,
                }}>
                    {cakes.map((cake, i) => (
                        <div
                            key={cake.id}
                            className="glass-card animate-in"
                            style={{
                                padding: 24,
                                opacity: cake.isActive ? 1 : 0.5,
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ fontSize: 40 }}>🎂</div>
                                <span className={`badge ${cake.isActive ? 'badge-ready' : 'badge-cancelled'}`}>
                                    {cake.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{cake.name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, minHeight: 36 }}>
                                {cake.description || 'No description'}
                            </p>
                            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--accent)' }}>
                                {formatCurrency(cake.price)}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleEdit(cake)} className="btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}>
                                    Edit
                                </button>
                                <button onClick={() => handleToggle(cake)} className={cake.isActive ? 'btn-danger' : 'btn-primary'} style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}>
                                    {cake.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {cakes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎂</div>
                        <p>No cakes in your menu yet. Add your first cake!</p>
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                            {editingCake ? 'Edit Cake' : 'Add New Cake'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Cake Name</label>
                                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Chocolate Truffle" />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Price (₹)</label>
                                <input className="input-field" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="850" min="1" step="0.01" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Description</label>
                                <textarea className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your cake..." rows={3} style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Saving...' : editingCake ? 'Update' : 'Add Cake'}
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
