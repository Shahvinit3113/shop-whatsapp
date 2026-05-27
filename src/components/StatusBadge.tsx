'use client';

interface StatusBadgeProps {
    status: string;
    type?: 'order' | 'payment';
}

const orderStatusMap: Record<string, { class: string; label: string }> = {
    NEW: { class: 'badge-new', label: 'New' },
    CONFIRMED: { class: 'badge-confirmed', label: 'Confirmed' },
    PREPARING: { class: 'badge-preparing', label: 'Preparing' },
    READY: { class: 'badge-ready', label: 'Ready' },
    DELIVERED: { class: 'badge-delivered', label: 'Delivered' },
    CANCELLED: { class: 'badge-cancelled', label: 'Cancelled' },
};

const paymentStatusMap: Record<string, { class: string; label: string }> = {
    PENDING: { class: 'badge-pending', label: 'Pending' },
    PARTIAL: { class: 'badge-partial', label: 'Partial' },
    PAID: { class: 'badge-paid', label: 'Paid' },
};

export default function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
    const map = type === 'payment' ? paymentStatusMap : orderStatusMap;
    const config = map[status] || { class: '', label: status };

    return (
        <span className={`badge ${config.class}`}>
            {config.label}
        </span>
    );
}
