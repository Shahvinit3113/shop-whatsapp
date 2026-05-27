import { z } from 'zod';

// ============================================
// Auth Validations
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['SUPER_ADMIN', 'SHOP_ADMIN']).default('SHOP_ADMIN'),
});

// ============================================
// Shop Validations
// ============================================

export const createShopSchema = z.object({
    name: z.string().min(2, 'Shop name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    address: z.string().optional(),
});

export const updateShopSchema = createShopSchema.partial().extend({
    isActive: z.boolean().optional(),
    whatsappPhoneNumberId: z.string().optional(),
    whatsappAccessToken: z.string().optional(),
});

// ============================================
// Cake Validations
// ============================================

export const createCakeSchema = z.object({
    name: z.string().min(2, 'Cake name must be at least 2 characters'),
    price: z.number().positive('Price must be positive'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateCakeSchema = createCakeSchema.partial();

// ============================================
// Customer Validations
// ============================================

export const createCustomerSchema = z.object({
    name: z.string().min(2, 'Customer name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================
// Order Validations
// ============================================

export const orderItemSchema = z.object({
    cakeId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
});

export const createOrderSchema = z.object({
    customerId: z.string().uuid(),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    pickupTime: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
});

// ============================================
// Payment Validations
// ============================================

export const createPaymentSchema = z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
    method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
    transactionId: z.string().optional(),
});

// ============================================
// Subscription Validations
// ============================================

export const createSubscriptionSchema = z.object({
    shopId: z.string().uuid(),
    planType: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).default('FREE'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const updateSubscriptionSchema = z.object({
    planType: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
});
