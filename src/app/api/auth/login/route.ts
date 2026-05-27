import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, signJWT, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { errorResponse, serverErrorResponse, successResponse, validationErrorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { email, password } = parsed.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return errorResponse('Invalid email or password', 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return errorResponse('Invalid email or password', 401);
        }

        // Get user's shop (for SHOP_ADMIN)
        let shopId: string | undefined;
        if (user.role === 'SHOP_ADMIN') {
            const userShop = await prisma.userShop.findFirst({
                where: { userId: user.id },
            });
            if (userShop) {
                shopId = userShop.shopId;
            }
        }

        // Sign JWT
        const token = await signJWT({
            userId: user.id,
            email: user.email,
            role: user.role,
            shopId,
        });

        // Set cookie
        const response = successResponse({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId,
            },
            token,
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        return serverErrorResponse(error);
    }
}
