import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import {
    errorResponse,
    forbiddenResponse,
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from '@/lib/errors';
import { z } from 'zod';

// GET /api/messages?phone=...
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'SHOP_ADMIN' || !user.shopId) {
            return unauthorizedResponse();
        }

        const { searchParams } = request.nextUrl;
        const phone = searchParams.get('phone');

        if (!phone) {
            return errorResponse('Phone parameter is required', 400);
        }

        // Fetch messages where either from or to is the customer phone
        const messages = await prisma.whatsAppMessage.findMany({
            where: {
                shopId: user.shopId,
                OR: [
                    { from: { contains: phone } },
                    { to: { contains: phone } },
                ]
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return successResponse(messages);
    } catch (error) {
        return serverErrorResponse(error);
    }
}

// POST /api/messages
const sendMessageSchema = z.object({
    phone: z.string().min(10, 'Phone is required'),
    body: z.string().min(1, 'Message body is required'),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'SHOP_ADMIN' || !user.shopId) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const parsed = sendMessageSchema.safeParse(body);

        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { phone, body: messageBody } = parsed.data;

        // Ensure the shop is configured for WhatsApp
        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId },
        });

        if (!shop || !shop.whatsappPhoneNumberId || !shop.whatsappAccessToken) {
            return errorResponse('Shop is not configured for WhatsApp', 400);
        }

        // Send the message via WhatsApp API (this also logs it via the updated whatsapp.ts)
        const response = await sendWhatsAppMessage(
            shop.whatsappAccessToken,
            shop.whatsappPhoneNumberId,
            phone,
            messageBody,
            shop.id
        );

        // Fetch the created message to return to UI (the newest one sent)
        const createdMessage = await prisma.whatsAppMessage.findFirst({
            where: {
                shopId: shop.id,
                to: phone,
                body: messageBody,
            },
            orderBy: {
                timestamp: 'desc',
            }
        });

        return successResponse(createdMessage, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
