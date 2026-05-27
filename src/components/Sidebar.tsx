'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
    userName: string;
    shopName?: string;
    role: 'SUPER_ADMIN' | 'SHOP_ADMIN';
}

interface NavItem {
    label: string;
    href: string;
    icon: string;
}

export default function Sidebar({ userName, shopName, role }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const adminNavItems: NavItem[] = [
        { label: 'Dashboard', href: '/admin', icon: '📊' },
        { label: 'All Shops', href: '/admin/shops', icon: '🏪' },
        { label: 'Subscriptions', href: '/admin/subscriptions', icon: '💳' },
    ];

    const shopNavItems: NavItem[] = [
        { label: 'Dashboard', href: '/shop', icon: '📊' },
        { label: 'Orders', href: '/shop/orders', icon: '📋' },
        { label: 'Cakes', href: '/shop/cakes', icon: '🎂' },
        { label: 'Customers', href: '/shop/customers', icon: '👥' },
    ];

    const navItems = role === 'SUPER_ADMIN' ? adminNavItems : shopNavItems;

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/shop') return pathname === href;
        return pathname.startsWith(href);
    };

    const sidebarContent = (
        <>
            {/* Header */}
            <div style={{
                padding: '24px 20px 20px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 20 }}>🎂</span>
                    </div>
                    {!collapsed && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>CakeShop Pro</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {role === 'SUPER_ADMIN' ? 'Super Admin' : shopName || 'Shop Admin'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ padding: '16px 12px', flex: 1 }}>
                {navItems.map((item) => (
                    <button
                        key={item.href}
                        onClick={() => {
                            router.push(item.href);
                            setMobileOpen(false);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            width: '100%',
                            padding: collapsed ? '12px' : '12px 16px',
                            marginBottom: 4,
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: isActive(item.href) ? 600 : 500,
                            color: isActive(item.href) ? 'var(--accent-light)' : 'var(--text-secondary)',
                            background: isActive(item.href)
                                ? '#eef2ff'
                                : 'transparent',
                            transition: 'all 0.2s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.href)) {
                                e.currentTarget.style.background = 'var(--bg-card-hover)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.href)) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        {!collapsed && item.label}
                    </button>
                ))}
            </nav>

            {/* User section */}
            <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{
                                fontWeight: 600,
                                fontSize: 13,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {userName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {role === 'SUPER_ADMIN' ? 'Admin' : 'Shop Admin'}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--danger)';
                        e.currentTarget.style.color = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <span>🚪</span>
                    {!collapsed && 'Logout'}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="hide-desktop"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 60,
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {mobileOpen ? '✕' : '☰'}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="hide-desktop"
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                    }}
                />
            )}

            {/* Desktop sidebar */}
            <aside
                className="hide-mobile"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: collapsed ? 72 : 260,
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    zIndex: 30,
                    overflow: 'hidden',
                }}
            >
                {sidebarContent}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute',
                        top: 28,
                        right: -12,
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {collapsed ? '→' : '←'}
                </button>
            </aside>

            {/* Mobile sidebar */}
            <aside
                className="hide-desktop"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 280,
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                }}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
