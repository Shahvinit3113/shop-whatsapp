import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { createOrderSchema } from '@/lib/validations';
import { getPagination, paginatedResponse, generateOrderNumber } from '@/lib/utils';
import {
    errorResponse,
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

// GET /api/orders
export async function GET(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const search = searchParams.get('search') || '';
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const where: Record<string, unknown> = { shopId: ctx.shopId };
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (search) {
            where.orderNumber = { contains: search, mode: 'insensitive' };
        }
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom) (where.orderDate as Record<string, unknown>).gte = new Date(dateFrom);
            if (dateTo) (where.orderDate as Record<string, unknown>).lte = new Date(dateTo);
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.order.count({ where }),
        ]);

        // Fetch related customer names (application-level join)
        const customerIds = [...new Set(orders.map((o) => o.customerId))];
        const customers = await prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, phone: true },
        });
        const customerMap = new Map(customers.map((c) => [c.id, c]));

        const enrichedOrders = orders.map((order) => ({
            ...order,
            customer: customerMap.get(order.customerId) || null,
        }));

        return successResponse(paginatedResponse(enrichedOrders, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/orders
export async function POST(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const body = await request.json();
        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        // Verify customer belongs to this shop
        const customer = await prisma.customer.findFirst({
            where: { id: parsed.data.customerId, shopId: ctx.shopId },
        });
        if (!customer) return errorResponse('Customer not found in this shop', 404);

        // Verify all cakes belong to this shop
        const cakeIds = parsed.data.items.map((i) => i.cakeId);
        const cakes = await prisma.cake.findMany({
            where: { id: { in: cakeIds }, shopId: ctx.shopId, isActive: true },
        });
        if (cakes.length !== cakeIds.length) {
            return errorResponse('One or more cakes not found or inactive', 404);
        }

        // Calculate total
        const totalAmount = parsed.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Generate unique order number
        const shop = await prisma.shop.findUnique({ where: { id: ctx.shopId } });
        const orderNumber = generateOrderNumber(shop?.name);

        // Create order
        const order = await prisma.order.create({
            data: {
                shopId: ctx.shopId,
                customerId: parsed.data.customerId,
                orderNumber,
                totalAmount,
                pickupTime: parsed.data.pickupTime ? new Date(parsed.data.pickupTime) : null,
                notes: parsed.data.notes,
            },
        });

        // Create order items
        await prisma.orderItem.createMany({
            data: parsed.data.items.map((item) => ({
                shopId: ctx.shopId,
                orderId: order.id,
                cakeId: item.cakeId,
                quantity: item.quantity,
                price: item.price,
            })),
        });

        // Fetch order items
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId: order.id },
        });

        return successResponse({ ...order, items: orderItems, customer }, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
