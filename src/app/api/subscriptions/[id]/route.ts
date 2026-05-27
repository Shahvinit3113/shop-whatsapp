import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { updateSubscriptionSchema } from '@/lib/validations';
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

// PUT /api/subscriptions/[id]
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const { id } = await params;
        const body = await request.json();
        const parsed = updateSubscriptionSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const existing = await prisma.subscription.findUnique({ where: { id } });
        if (!existing) return notFoundResponse('Subscription not found');

        const updated = await prisma.subscription.update({
            where: { id },
            data: {
                ...parsed.data,
                endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
            },
        });

        return successResponse(updated);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
