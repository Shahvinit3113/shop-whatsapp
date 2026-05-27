import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { updateCakeSchema } from '@/lib/validations';
import {
    notFoundResponse,
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/cakes/[id]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const cake = await prisma.cake.findFirst({
            where: { id, shopId: ctx.shopId },
        });

        if (!cake) return notFoundResponse('Cake not found');
        return successResponse(cake);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// PUT /api/cakes/[id]
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const body = await request.json();
        const parsed = updateCakeSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await prisma.cake.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!existing) return notFoundResponse('Cake not found');

        const cake = await prisma.cake.update({
            where: { id },
            data: parsed.data,
        });

        return successResponse(cake);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// DELETE /api/cakes/[id] — Soft delete
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { id } = await params;
        const existing = await prisma.cake.findFirst({
            where: { id, shopId: ctx.shopId },
        });
        if (!existing) return notFoundResponse('Cake not found');

        const cake = await prisma.cake.update({
            where: { id },
            data: { isActive: false },
        });

        return successResponse(cake);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
