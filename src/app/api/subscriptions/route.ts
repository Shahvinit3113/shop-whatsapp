import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createSubscriptionSchema } from '@/lib/validations';
import { getPagination, paginatedResponse } from '@/lib/utils';
import {
    forbiddenResponse,
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from '@/lib/errors';

// GET /api/subscriptions — Super Admin only
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const { searchParams } = request.nextUrl;
        const pagination = getPagination(searchParams);

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { startDate: 'desc' },
            }),
            prisma.subscription.count(),
        ]);

        // Enrich with shop names
        const shopIds = subscriptions.map((s) => s.shopId);
        const shops = await prisma.shop.findMany({
            where: { id: { in: shopIds } },
            select: { id: true, name: true },
        });
        const shopMap = new Map(shops.map((s) => [s.id, s]));

        const enriched = subscriptions.map((sub) => ({
            ...sub,
            shop: shopMap.get(sub.shopId) || null,
        }));

        return successResponse(paginatedResponse(enriched, total, pagination));
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/subscriptions
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const body = await request.json();
        const parsed = createSubscriptionSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const subscription = await prisma.subscription.create({
            data: {
                shopId: parsed.data.shopId,
                planType: parsed.data.planType,
                startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
                endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
            },
        });

        return successResponse(subscription, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
