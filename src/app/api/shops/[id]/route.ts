import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { updateShopSchema } from '@/lib/validations';
import {
    forbiddenResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from '@/lib/errors';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/shops/[id]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();

        const { id } = await params;

        // Shop admin can only view their own shop
        if (user.role === 'SHOP_ADMIN' && user.shopId !== id) {
            return forbiddenResponse();
        }

        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) return notFoundResponse('Shop not found');

        return successResponse(shop);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// PUT /api/shops/[id]
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();

        const { id } = await params;

        if (user.role === 'SHOP_ADMIN' && user.shopId !== id) {
            return forbiddenResponse();
        }

        const body = await request.json();
        const parsed = updateShopSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) return notFoundResponse('Shop not found');

        const updated = await prisma.shop.update({
            where: { id },
            data: parsed.data,
        });

        return successResponse(updated);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// DELETE /api/shops/[id] — Soft delete (deactivate)
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const { id } = await params;

        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) return notFoundResponse('Shop not found');

        const updated = await prisma.shop.update({
            where: { id },
            data: { isActive: false },
        });

        return successResponse(updated);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
