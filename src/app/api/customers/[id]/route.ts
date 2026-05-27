import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { updateCustomerSchema } from '@/lib/validations';
import {
    notFoundResponse,
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/customers/[id]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const customer = await prisma.customer.findFirst({
            where: { id, shopId: ctx.shopId },
        });

        if (!customer) return notFoundResponse('Customer not found');

        // Get customer's order history
        const orders = await prisma.order.findMany({
            where: { customerId: id, shopId: ctx.shopId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return successResponse({ ...customer, recentOrders: orders });
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// PUT /api/customers/[id]
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const body = await request.json();
        const parsed = updateCustomerSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await prisma.customer.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!existing) return notFoundResponse('Customer not found');

        const customer = await prisma.customer.update({
            where: { id },
            data: parsed.data,
        });

        return successResponse(customer);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// DELETE /api/customers/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const existing = await prisma.customer.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!existing) return notFoundResponse('Customer not found');

        await prisma.customer.delete({ where: { id } });
        return successResponse({ message: 'Customer deleted' });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
