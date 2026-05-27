import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, JWTPayload } from './auth';

// ============================================
// Tenant Context
// ============================================

export interface TenantContext {
    userId: string;
    email: string;
    role: 'SUPER_ADMIN' | 'SHOP_ADMIN';
    shopId: string;
}

/**
 * Get tenant context from the request.
 * - For SHOP_ADMIN: shopId comes from JWT
 * - For SUPER_ADMIN: shopId can be passed as query param to act on behalf of a shop
 */
export async function getTenantContext(
    request: NextRequest
): Promise<TenantContext | NextResponse> {
    const user = await getCurrentUser(request);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'SUPER_ADMIN') {
        // Super admin can optionally target a specific shop
        const shopId = request.nextUrl.searchParams.get('shopId') || '';
        return {
            userId: user.userId,
            email: user.email,
            role: user.role,
            shopId,
        };
    }

    if (!user.shopId) {
        return NextResponse.json(
            { error: 'No shop assigned to this user' },
            { status: 403 }
        );
    }

    return {
        userId: user.userId,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
    };
}

/**
 * Require a specific role. Returns error response if role doesn't match.
 */
export function requireRole(
    user: JWTPayload,
    ...roles: Array<'SUPER_ADMIN' | 'SHOP_ADMIN'>
): NextResponse | null {
    if (!roles.includes(user.role)) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Validate that shopId is present in tenant context.
 */
export function requireShopId(ctx: TenantContext): NextResponse | null {
    if (!ctx.shopId) {
        return NextResponse.json(
            { error: 'Shop ID is required' },
            { status: 400 }
        );
    }
    return null;
}
