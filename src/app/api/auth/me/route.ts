import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serverErrorResponse, successResponse, unauthorizedResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
    try {
        const payload = await getCurrentUser(request);
        if (!payload) {
            return unauthorizedResponse();
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return unauthorizedResponse('User not found');
        }

        // Get shop info if applicable
        let shop = null;
        if (payload.shopId) {
            shop = await prisma.shop.findUnique({
                where: { id: payload.shopId },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    isActive: true,
                },
            });
        }

        return successResponse({ ...user, shop, shopId: payload.shopId });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
