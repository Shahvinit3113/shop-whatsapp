'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Shop {
    id: string;
    name: string;
    phone: string;
    address: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminShopsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);

    const fetchShops = async () => {
        const res = await fetch('/api/shops?limit=50');
        const data = await res.json();
        if (data.success) setShops(data.data.data);
    };

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then((r) => r.json()),
            fetchShops(),
        ])
            .then(([userData]) => {
                if (userData.data?.role !== 'SUPER_ADMIN') { router.push('/shop'); return; }
                setUser(userData.data);
                setLoading(false);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        setShowModal(false);
        setForm({ name: '', phone: '', address: '' });
        setSaving(false);
        fetchShops();
    };

    const toggleShop = async (shop: Shop) => {
        await fetch(`/api/shops/${shop.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !shop.isActive }),
        });
        fetchShops();
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏪 <span style={{ color: 'var(--accent)' }}>All Shops</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{shops.length} registered shops</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Shop</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {shops.map((shop, i) => (
                        <div key={shop.id} className="glass-card animate-in" style={{ padding: 24, opacity: shop.isActive ? 1 : 0.6, animationDelay: `${i * 0.05}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        background: shop.isActive ? 'var(--accent)' : 'var(--bg-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                                    }}>🏪</div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: 16 }}>{shop.name}</h3>
                                        <span className={`badge ${shop.isActive ? 'badge-ready' : 'badge-cancelled'}`}>
                                            {shop.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                <div style={{ marginBottom: 4 }}>📞 {shop.phone}</div>
                                {shop.address && <div>📍 {shop.address}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => toggleShop(shop)} className={shop.isActive ? 'btn-danger' : 'btn-primary'} style={{ flex: 1, padding: '8px 16px', fontSize: 13 }}>
                                    {shop.isActive ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Add New Shop</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Shop Name</label>
                                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Sweet Delights Bakery" />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Phone</label>
                                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="9876543210" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Address</label>
                                <textarea className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shop address" rows={2} style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Shop'}
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
