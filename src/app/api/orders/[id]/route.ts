import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import {
    notFoundResponse,
    serverErrorResponse,
    successResponse,
} from '@/lib/errors';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/orders/[id]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const order = await prisma.order.findFirst({
            where: { id, shopId: ctx.shopId },
        });

        if (!order) return notFoundResponse('Order not found');

        // Fetch related data (application-level joins)
        const [customer, orderItems, payments] = await Promise.all([
            prisma.customer.findFirst({
                where: { id: order.customerId, shopId: ctx.shopId },
            }),
            prisma.orderItem.findMany({
                where: { orderId: order.id },
            }),
            prisma.payment.findMany({
                where: { orderId: order.id, shopId: ctx.shopId },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        // Fetch cake details for order items
        const cakeIds = orderItems.map((oi) => oi.cakeId);
        const cakes = await prisma.cake.findMany({
            where: { id: { in: cakeIds } },
            select: { id: true, name: true },
        });
        const cakeMap = new Map(cakes.map((c) => [c.id, c]));

        const enrichedItems = orderItems.map((item) => ({
            ...item,
            cake: cakeMap.get(item.cakeId) || null,
        }));

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        return successResponse({
            ...order,
            customer,
            items: enrichedItems,
            payments,
            totalPaid,
            balanceDue: order.totalAmount - totalPaid,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// DELETE /api/orders/[id] — Cancel order
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const existing = await prisma.order.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!existing) return notFoundResponse('Order not found');

        const order = await prisma.order.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return successResponse(order);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
