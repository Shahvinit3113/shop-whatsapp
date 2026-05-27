import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createShopSchema } from '@/lib/validations';
import { getPagination, paginatedResponse } from '@/lib/utils';
import {
    errorResponse,
    forbiddenResponse,
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from '@/lib/errors';

// GET /api/shops — List all shops (Super Admin only)
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);
        const search = searchParams.get('search') || '';

        const where = search
            ? { name: { contains: search, mode: 'insensitive' as const } }
            : {};

        const [shops, total] = await Promise.all([
            prisma.shop.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shop.count({ where }),
        ]);

        return successResponse(paginatedResponse(shops, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/shops — Create shop (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const body = await request.json();
        const parsed = createShopSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const shop = await prisma.shop.create({
            data: parsed.data,
        });

        // If userId is provided, assign user to shop
        if (body.userId) {
            await prisma.userShop.create({
                data: {
                    userId: body.userId,
                    shopId: shop.id,
                },
            });
        }

        return successResponse(shop, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
