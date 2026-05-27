'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface Cake {
    id: string;
    name: string;
    price: number;
}

export default function NewOrderPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shop?: { name: string } } | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cakes, setCakes] = useState<Cake[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [items, setItems] = useState<Array<{ cakeId: string; quantity: number; price: number }>>([]);
    const [notes, setNotes] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then((r) => r.json()),
            fetch('/api/customers?limit=100').then((r) => r.json()),
            fetch('/api/cakes?active=true&limit=100').then((r) => r.json()),
        ])
            .then(([userData, custData, cakeData]) => {
                setUser(userData.data);
                setCustomers(custData.data?.data || []);
                setCakes(cakeData.data?.data || []);
                setLoading(false);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const addItem = () => {
        if (cakes.length > 0) {
            setItems([...items, { cakeId: cakes[0].id, quantity: 1, price: cakes[0].price }]);
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const updated = [...items];
        if (field === 'cakeId') {
            const cake = cakes.find((c) => c.id === value);
            updated[index] = { ...updated[index], cakeId: value as string, price: cake?.price || 0 };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setItems(updated);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) { setError('Please select a customer'); return; }
        if (items.length === 0) { setError('Please add at least one item'); return; }

        setSaving(true);
        setError('');

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: selectedCustomer,
                items,
                notes: notes || undefined,
                pickupTime: pickupTime ? new Date(pickupTime).toISOString() : undefined,
            }),
        });

        const data = await res.json();
        if (data.success) {
            router.push('/shop/orders');
        } else {
            setError(data.error || 'Failed to create order');
            setSaving(false);
        }
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

            <main style={{ flex: 1, marginLeft: 260, padding: 32, maxWidth: 800 }} className="responsive-main">
                <div style={{ marginBottom: 24 }}>
                    <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 8 }}>
                        ← Back to Orders
                    </button>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>📝 <span style={{ color: 'var(--accent)' }}>New Order</span></h1>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', fontSize: 14, marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Customer</h2>
                        <select className="select-field" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} required>
                            <option value="">Select a customer...</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Order Items</h2>
                            <button type="button" onClick={addItem} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                                + Add Item
                            </button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select className="select-field" value={item.cakeId} onChange={(e) => updateItem(index, 'cakeId', e.target.value)} style={{ flex: 2, minWidth: 150 }}>
                                    {cakes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} — {formatCurrency(c.price)}</option>
                                    ))}
                                </select>
                                <input type="number" className="input-field" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} min={1} style={{ flex: 0, width: 80 }} />
                                <span style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</span>
                                <button type="button" onClick={() => removeItem(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No items added yet</p>
                        )}

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
                            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Additional Details</h2>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Pickup Time (Optional)</label>
                            <input type="datetime-local" className="input-field" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Notes (Optional)</label>
                            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any special instructions..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', padding: '16px', fontSize: 16 }}>
                        {saving ? 'Creating Order...' : `Create Order — ${formatCurrency(totalAmount)}`}
                    </button>
                </form>
            </main>

            <style jsx>{`
        @media (max-width: 768px) {
          .responsive-main { margin-left: 0 !important; padding: 72px 16px 16px !important; max-width: 100% !important; }
        }
      `}</style>
        </div>
    );
}
