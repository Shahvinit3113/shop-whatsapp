import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getTenantContext, requireShopId } from '@/lib/tenant';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from '@/lib/utils';
import {
    forbiddenResponse,
    serverErrorResponse,
    successResponse,
    unauthorizedResponse,
} from '@/lib/errors';

// GET /api/dashboard
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return unauthorizedResponse();

        // Super Admin gets platform-wide stats
        if (user.role === 'SUPER_ADMIN') {
            const [totalShops, activeShops, totalOrders, totalRevenue] = await Promise.all([
                prisma.shop.count(),
                prisma.shop.count({ where: { isActive: true } }),
                prisma.order.count(),
                prisma.order.aggregate({ _sum: { totalAmount: true } }),
            ]);

            const activeSubscriptions = await prisma.subscription.count({
                where: { isActive: true },
            });

            return successResponse({
                totalShops,
                activeShops,
                totalOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                activeSubscriptions,
            });
        }

        // Shop Admin gets shop-specific stats
        const ctx = await getTenantContext(request);
        if (ctx instanceof NextResponse) return ctx;
        const shopError = requireShopId(ctx);
        if (shopError) return shopError;

        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        const [
            todaysOrders,
            todaysOrderCount,
            monthlyRevenue,
            pendingPayments,
            totalCustomers,
            recentOrders,
            ordersByStatus,
        ] = await Promise.all([
            // Today's orders
            prisma.order.findMany({
                where: {
                    shopId: ctx.shopId,
                    orderDate: { gte: todayStart, lte: todayEnd },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            // Today's order count
            prisma.order.count({
                where: {
                    shopId: ctx.shopId,
                    orderDate: { gte: todayStart, lte: todayEnd },
                },
            }),
            // Monthly revenue
            prisma.order.aggregate({
                where: {
                    shopId: ctx.shopId,
                    orderDate: { gte: monthStart, lte: monthEnd },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
            }),
            // Pending payments
            prisma.order.aggregate({
                where: {
                    shopId: ctx.shopId,
                    paymentStatus: { in: ['PENDING', 'PARTIAL'] },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
                _count: true,
            }),
            // Total customers
            prisma.customer.count({ where: { shopId: ctx.shopId } }),
            // Recent orders
            prisma.order.findMany({
                where: { shopId: ctx.shopId },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            // Orders by status
            prisma.order.groupBy({
                by: ['status'],
                where: { shopId: ctx.shopId },
                _count: true,
            }),
        ]);

        // Enrich recent orders with customer names
        const customerIds = [...new Set(recentOrders.map((o) => o.customerId))];
        const customers = await prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, phone: true },
        });
        const customerMap = new Map(customers.map((c) => [c.id, c]));

        const enrichedRecentOrders = recentOrders.map((order) => ({
            ...order,
            customer: customerMap.get(order.customerId) || null,
        }));

        return successResponse({
            todaysOrders: enrichedRecentOrders,
            todaysOrderCount,
            monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
            pendingPayments: {
                amount: pendingPayments._sum.totalAmount || 0,
                count: pendingPayments._count,
            },
            totalCustomers,
            recentOrders: enrichedRecentOrders,
            ordersByStatus: ordersByStatus.reduce(
                (acc, item) => ({ ...acc, [item.status]: item._count }),
                {} as Record<string, number>
            ),
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
