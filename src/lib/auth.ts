import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// ============================================
// Types
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'SUPER_ADMIN' | 'SHOP_ADMIN';
    shopId?: string;
}

// ============================================
// Password Hashing
// ============================================

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// JWT — using jose (edge-compatible)
// ============================================

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me');

export async function signJWT(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

// ============================================
// Cookie helpers
// ============================================

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function getAuthCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value;
}

export async function removeAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

// ============================================
// Get current user from request
// ============================================

export async function getCurrentUser(request?: NextRequest): Promise<JWTPayload | null> {
    let token: string | undefined;

    if (request) {
        token = request.cookies.get('auth-token')?.value;
    } else {
        token = await getAuthCookie();
    }

    if (!token) return null;
    return verifyJWT(token);
}
