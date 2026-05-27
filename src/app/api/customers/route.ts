import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { createCustomerSchema } from '@/lib/validations';
import { getPagination, paginatedResponse } from '@/lib/utils';
import {
    serverErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/errors';

// GET /api/customers
export async function GET(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);
        const search = searchParams.get('search') || '';

        const where: Record<string, unknown> = { shopId: ctx.shopId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.customer.count({ where }),
        ]);

        return successResponse(paginatedResponse(customers, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/customers
export async function POST(request: NextRequest) {
    try {
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const body = await request.json();
        const parsed = createCustomerSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const customer = await prisma.customer.create({
            data: {
                ...parsed.data,
                shopId: ctx.shopId,
            },
        });

        return successResponse(customer, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
