import { PrismaClient } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@cakeshop.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@cakeshop.com',
            passwordHash: superAdminPassword,
            role: 'SUPER_ADMIN',
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Shop 1
    const shop1 = await prisma.shop.create({
        data: {
            name: 'Sweet Delights Bakery',
            phone: '9876543210',
            address: '123 MG Road, Mumbai, Maharashtra',
        },
    });
    console.log('✅ Shop 1 created:', shop1.name);

    // Create Shop Admin for Shop 1
    const shopAdmin1Password = await bcrypt.hash('shop123', 12);
    const shopAdmin1 = await prisma.user.upsert({
        where: { email: 'sweet@cakeshop.com' },
        update: {},
        create: {
            name: 'Rahul Sharma',
            email: 'sweet@cakeshop.com',
            passwordHash: shopAdmin1Password,
            role: 'SHOP_ADMIN',
        },
    });

    await prisma.userShop.create({
        data: {
            userId: shopAdmin1.id,
            shopId: shop1.id,
        },
    });
    console.log('✅ Shop Admin 1 created:', shopAdmin1.email);

    // Create Shop 2
    const shop2 = await prisma.shop.create({
        data: {
            name: 'Royal Cakes Studio',
            phone: '9876543211',
            address: '456 Park Street, Kolkata, West Bengal',
        },
    });
    console.log('✅ Shop 2 created:', shop2.name);

    // Create Shop Admin for Shop 2
    const shopAdmin2Password = await bcrypt.hash('shop123', 12);
    const shopAdmin2 = await prisma.user.upsert({
        where: { email: 'royal@cakeshop.com' },
        update: {},
        create: {
            name: 'Priya Patel',
            email: 'royal@cakeshop.com',
            passwordHash: shopAdmin2Password,
            role: 'SHOP_ADMIN',
        },
    });

    await prisma.userShop.create({
        data: {
            userId: shopAdmin2.id,
            shopId: shop2.id,
        },
    });
    console.log('✅ Shop Admin 2 created:', shopAdmin2.email);

    // Create Customers for Shop 1
    const customers1 = await Promise.all([
        prisma.customer.create({
            data: { shopId: shop1.id, name: 'Amit Kumar', phone: '9111111111' },
        }),
        prisma.customer.create({
            data: { shopId: shop1.id, name: 'Neha Singh', phone: '9222222222' },
        }),
        prisma.customer.create({
            data: { shopId: shop1.id, name: 'Vikram Joshi', phone: '9333333333' },
        }),
    ]);
    console.log('✅ 3 customers created for Shop 1');

    // Create Customers for Shop 2
    const customers2 = await Promise.all([
        prisma.customer.create({
            data: { shopId: shop2.id, name: 'Sanjay Roy', phone: '9444444444' },
        }),
        prisma.customer.create({
            data: { shopId: shop2.id, name: 'Meera Das', phone: '9555555555' },
        }),
    ]);
    console.log('✅ 2 customers created for Shop 2');

    // Create Cakes for Shop 1
    const cakes1 = await Promise.all([
        prisma.cake.create({
            data: {
                shopId: shop1.id,
                name: 'Chocolate Truffle',
                price: 850,
                description: 'Rich Belgian chocolate truffle cake with dark chocolate ganache',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop1.id,
                name: 'Red Velvet',
                price: 950,
                description: 'Classic red velvet cake with cream cheese frosting',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop1.id,
                name: 'Butterscotch Crunch',
                price: 750,
                description: 'Butterscotch cake with caramel crunch topping',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop1.id,
                name: 'Black Forest',
                price: 800,
                description: 'Classic black forest cake with cherries and whipped cream',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop1.id,
                name: 'Pineapple Delight',
                price: 700,
                description: 'Fresh pineapple cake with vanilla cream layers',
            },
        }),
    ]);
    console.log('✅ 5 cakes created for Shop 1');

    // Create Cakes for Shop 2
    const cakes2 = await Promise.all([
        prisma.cake.create({
            data: {
                shopId: shop2.id,
                name: 'Royal Chocolate',
                price: 1200,
                description: 'Premium chocolate cake with gold leaf decoration',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop2.id,
                name: 'Mango Paradise',
                price: 1000,
                description: 'Fresh Alphonso mango cake with mango mousse',
            },
        }),
        prisma.cake.create({
            data: {
                shopId: shop2.id,
                name: 'Strawberry Bliss',
                price: 900,
                description: 'Strawberry cake with fresh berry compote',
            },
        }),
    ]);
    console.log('✅ 3 cakes created for Shop 2');

    // Create Orders for Shop 1
    const order1 = await prisma.order.create({
        data: {
            shopId: shop1.id,
            customerId: customers1[0].id,
            orderNumber: 'SWE-20260227-0001',
            totalAmount: 1700,
            status: 'CONFIRMED',
            paymentStatus: 'PENDING',
        },
    });

    await prisma.orderItem.createMany({
        data: [
            { shopId: shop1.id, orderId: order1.id, cakeId: cakes1[0].id, quantity: 1, price: 850 },
            { shopId: shop1.id, orderId: order1.id, cakeId: cakes1[1].id, quantity: 1, price: 850 },
        ],
    });

    const order2 = await prisma.order.create({
        data: {
            shopId: shop1.id,
            customerId: customers1[1].id,
            orderNumber: 'SWE-20260227-0002',
            totalAmount: 750,
            status: 'NEW',
            paymentStatus: 'PAID',
        },
    });

    await prisma.orderItem.create({
        data: { shopId: shop1.id, orderId: order2.id, cakeId: cakes1[2].id, quantity: 1, price: 750 },
    });

    const order3 = await prisma.order.create({
        data: {
            shopId: shop1.id,
            customerId: customers1[2].id,
            orderNumber: 'SWE-20260227-0003',
            totalAmount: 2400,
            status: 'PREPARING',
            paymentStatus: 'PARTIAL',
        },
    });

    await prisma.orderItem.createMany({
        data: [
            { shopId: shop1.id, orderId: order3.id, cakeId: cakes1[3].id, quantity: 2, price: 800 },
            { shopId: shop1.id, orderId: order3.id, cakeId: cakes1[4].id, quantity: 1, price: 700 },
        ],
    });

    console.log('✅ 3 orders created for Shop 1');

    // Create payment for order2
    await prisma.payment.create({
        data: {
            shopId: shop1.id,
            orderId: order2.id,
            amount: 750,
            method: 'UPI',
            status: 'PAID',
            transactionId: 'UPI-20260227-001',
        },
    });

    // Create partial payment for order3
    await prisma.payment.create({
        data: {
            shopId: shop1.id,
            orderId: order3.id,
            amount: 1000,
            method: 'CASH',
            status: 'PAID',
        },
    });
    console.log('✅ Payments created');

    // Create Subscriptions
    await Promise.all([
        prisma.subscription.create({
            data: {
                shopId: shop1.id,
                planType: 'PREMIUM',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            },
        }),
        prisma.subscription.create({
            data: {
                shopId: shop2.id,
                planType: 'BASIC',
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-08-01'),
            },
        }),
    ]);
    console.log('✅ Subscriptions created');

    console.log('\n🎉 Seed completed!');
    console.log('\n📋 Login credentials:');
    console.log('   Super Admin: admin@cakeshop.com / admin123');
    console.log('   Shop Admin 1 (Sweet Delights): sweet@cakeshop.com / shop123');
    console.log('   Shop Admin 2 (Royal Cakes): royal@cakeshop.com / shop123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
