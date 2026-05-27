import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { updateOrderStatusSchema } from '@/lib/validations';
import {
    errorResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

interface Params {
    params: Promise<{ id: string }>;
}

// Valid status transitions
const validTransitions: Record<string, string[]> = {
    NEW: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
};

// PATCH /api/orders/[id]/status
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const body = await request.json();
        const parsed = updateOrderStatusSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const order = await prisma.order.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!order) return notFoundResponse('Order not found');

        // Validate status transition
        const allowed = validTransitions[order.status] || [];
        if (!allowed.includes(parsed.data.status)) {
            return errorResponse(
                `Cannot transition from ${order.status} to ${parsed.data.status}. Allowed: ${allowed.join(', ') || 'none'}`,
                400
            );
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: parsed.data.status },
        });

        return successResponse(updated);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
