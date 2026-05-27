import { v4 as uuidv4 } from 'uuid';

// ============================================
// Pagination
// ============================================

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export function getPagination(searchParams: URLSearchParams): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

export function paginatedResponse(data: unknown[], total: number, params: PaginationParams) {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
        },
    };
}

// ============================================
// Order Number Generator
// ============================================

export function generateOrderNumber(shopPrefix?: string): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = shopPrefix ? shopPrefix.substring(0, 3).toUpperCase() : 'ORD';
    return `${prefix}-${dateStr}-${random}`;
}

// ============================================
// UUID helper
// ============================================

export function generateUUID(): string {
    return uuidv4();
}

// ============================================
// Date helpers
// ============================================

export function startOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function startOfMonth(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfMonth(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
}

// ============================================
// Currency formatter
// ============================================

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}
