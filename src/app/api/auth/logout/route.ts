import { NextRequest } from 'next/server';
import { successResponse, unauthorizedResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
    const response = successResponse({ message: 'Logged out successfully' });
    response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}
