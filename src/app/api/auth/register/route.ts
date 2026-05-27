import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { errorResponse, serverErrorResponse, successResponse, validationErrorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return validationErrorResponse(parsed.error);
        }

        const { name, email, password, role } = parsed.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse('User with this email already exists', 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return successResponse(user, 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
}
