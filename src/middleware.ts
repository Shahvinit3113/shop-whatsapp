import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/webhooks'];

// Routes that require SUPER_ADMIN role
const adminRoutes = ['/admin', '/api/admin'];

function isPublicRoute(pathname: string): boolean {
    return publicRoutes.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
    return adminRoutes.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // Allow static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        if (isApiRoute(pathname)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify JWT
    const payload = await verifyJWT(token);

    if (!payload) {
        if (isApiRoute(pathname)) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check admin routes
    if (isAdminRoute(pathname) && payload.role !== 'SUPER_ADMIN') {
        if (isApiRoute(pathname)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/shop', request.url));
    }

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    if (payload.shopId) {
        requestHeaders.set('x-shop-id', payload.shopId);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
