'use client';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

export default function StatCard({ title, value, icon, subtitle, color }: StatCardProps) {
    return (
        <div className="glass-card animate-in" style={{
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Gradient accent */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: color || 'var(--accent)',
                borderRadius: '8px 8px 0 0',
            }} />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                <div>
                    <p style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        {title}
                    </p>
                    <p style={{
                        color: color || 'var(--text-primary)',
                        fontWeight: 800,
                        marginBottom: subtitle ? 4 : 0,
                    }}>
                        {value}
                    </p>
                    {subtitle && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
