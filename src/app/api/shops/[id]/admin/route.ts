import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import {
    errorResponse,
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

// POST /api/shops/[id]/admin — Create an admin user and link to shop (Super Admin only)
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();
        if (user.role !== 'SUPER_ADMIN') return forbiddenResponse();

        const { id } = await params;

        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) return notFoundResponse('Shop not found');

        const body = await request.json();
        
        // Ensure role is SHOP_ADMIN
        body.role = 'SHOP_ADMIN';

        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) return validationErrorResponse(parsed.error);

        const { name, email, password } = parsed.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse('User with this email already exists', 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Run transaction to create User and UserShop mapping
        const newUser = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: 'SHOP_ADMIN',
                },
            });

            await tx.userShop.create({
                data: {
                    userId: createdUser.id,
                    shopId: shop.id,
                },
            });

            return createdUser;
        });

        return successResponse({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        }, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
