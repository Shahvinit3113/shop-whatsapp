'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { format } from 'date-fns';

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface Message {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: string;
    shopId: string;
}

export default function ShopMessagesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; shopId: string; shopName?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.data?.role !== 'SHOP_ADMIN') {
                    router.push('/login');
                    return;
                }
                setUser(data.data);
                return fetchCustomers();
            })
            .catch(() => router.push('/login'));
    }, [router]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers?limit=100');
            const data = await res.json();
            if (data.success) {
                setCustomers(data.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (phone: string) => {
        try {
            const res = await fetch(`/api/messages?phone=${encodeURIComponent(phone)}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        fetchMessages(customer.phone);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: selectedCustomer.phone,
                    body: newMessage.trim(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                // Optionally append immediately or re-fetch
                setMessages((prev) => [...prev, data.data]);
            } else {
                alert(`Error: ${data.error || 'Failed to send message'}`);
            }
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
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
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar userName={user.name} shopName={user.shopName} role="SHOP_ADMIN" />

            <main style={{ flex: 1, marginLeft: 260, padding: '24px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }} className="responsive-main">
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>💬 <span style={{ color: 'var(--accent)' }}>Messages</span></h1>
                </div>

                <div className="glass-card" style={{ flex: 1, display: 'flex', overflow: 'hidden', borderRadius: 16 }}>
                    
                    {/* Left Pane: Customers List */}
                    <div style={{ width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 16 }}>
                            Customers
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {customers.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                                    No customers found.
                                </div>
                            ) : (
                                customers.map((customer) => (
                                    <div 
                                        key={customer.id} 
                                        onClick={() => handleSelectCustomer(customer)}
                                        style={{ 
                                            padding: '16px', 
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: selectedCustomer?.id === customer.id ? 'var(--bg-secondary)' : 'transparent',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{customer.name}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customer.phone}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Chat UI */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
                        {selectedCustomer ? (
                            <>
                                {/* Chat Header */}
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                                        {selectedCustomer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedCustomer.name}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedCustomer.phone}</div>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {messages.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 'auto', marginBottom: 'auto' }}>
                                            No message history found.
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            // Determine if it's sent by the shop (outgoing) or received from the customer (incoming)
                                            // If the message is TO the customer's phone, it's outgoing.
                                            const isOutgoing = msg.to.includes(selectedCustomer.phone) || msg.from === selectedCustomer.phone === false;

                                            return (
                                                <div key={msg.id} style={{ 
                                                    alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}>
                                                    <div style={{
                                                        background: isOutgoing ? '#dcf8c6' : '#ffffff',
                                                        color: '#111b21',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        borderTopLeftRadius: isOutgoing ? '8px' : '0',
                                                        borderTopRightRadius: isOutgoing ? '0' : '8px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        fontSize: 14,
                                                        lineHeight: '1.4',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {msg.body}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, alignSelf: isOutgoing ? 'flex-end' : 'flex-start' }}>
                                                        {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div style={{ padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                                        <input 
                                            type="text" 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            style={{ 
                                                flex: 1, 
                                                padding: '12px 16px', 
                                                borderRadius: 24, 
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-primary)',
                                                fontSize: 14,
                                                outline: 'none'
                                            }}
                                            disabled={sending}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={sending || !newMessage.trim()}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: '50%',
                                                background: newMessage.trim() ? 'var(--accent)' : 'var(--text-muted)',
                                                color: 'white',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <span style={{ fontSize: 18, transform: 'translateX(-2px)' }}>➤</span>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
                                Select a customer to view messages
                            </div>
                        )}
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
