import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
} from '@/lib/errors';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'SHOP_ADMIN' || !user.shopId) {
            return unauthorizedResponse();
        }

        const logs = await prisma.errorLog.findMany({
            where: {
                shopId: user.shopId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit to recent 100 logs
        });

        return successResponse(logs);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
