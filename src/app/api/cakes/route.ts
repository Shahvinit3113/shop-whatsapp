import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { createCakeSchema } from '@/lib/validations';
import { getPagination, paginatedResponse } from '@/lib/utils';
import {
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';
import { NextResponse } from 'next/server';

// GET /api/cakes
export async function GET(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);
        const search = searchParams.get('search') || '';
        const activeOnly = searchParams.get('active') === 'true';

        const where: Record<string, unknown> = { shopId: ctx.shopId };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (activeOnly) {
            where.isActive = true;
        }

        const [cakes, total] = await Promise.all([
            prisma.cake.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.cake.count({ where }),
        ]);

        return successResponse(paginatedResponse(cakes, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/cakes
export async function POST(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const body = await request.json();
        const parsed = createCakeSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const cake = await prisma.cake.create({
            data: {
                ...parsed.data,
                shopId: ctx.shopId,
            },
        });

        return successResponse(cake, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
