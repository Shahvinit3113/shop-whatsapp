import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { createPaymentSchema } from '@/lib/validations';
import { getPagination, paginatedResponse } from '@/lib/utils';
import {
    errorResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

// GET /api/payments
export async function GET(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);
        const orderId = searchParams.get('orderId');

        const where: Record<string, unknown> = { shopId: ctx.shopId };
        if (orderId) where.orderId = orderId;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.payment.count({ where }),
        ]);

        return successResponse(paginatedResponse(payments, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/payments
export async function POST(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const body = await request.json();
        const parsed = createPaymentSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        // Verify order belongs to this shop
        const order = await prisma.order.findFirst({
            where: { id: parsed.data.orderId, shopId: ctx.shopId },
        });
        if (!order) return notFoundResponse('Order not found');

        // Calculate existing payments
        const existingPayments = await prisma.payment.findMany({
            where: { orderId: order.id, shopId: ctx.shopId },
        });
        const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = order.totalAmount - totalPaid;

        if (parsed.data.amount > remaining) {
            return errorResponse(
                `Payment amount (${parsed.data.amount}) exceeds remaining balance (${remaining})`,
                400
            );
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                shopId: ctx.shopId,
                orderId: parsed.data.orderId,
                amount: parsed.data.amount,
                method: parsed.data.method,
                status: 'PAID',
                transactionId: parsed.data.transactionId,
            },
        });

        // Update order payment status
        const newTotalPaid = totalPaid + parsed.data.amount;
        const newPaymentStatus =
            newTotalPaid >= order.totalAmount ? 'PAID' : newTotalPaid > 0 ? 'PARTIAL' : 'PENDING';

        await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: newPaymentStatus },
        });

        return successResponse(payment, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
