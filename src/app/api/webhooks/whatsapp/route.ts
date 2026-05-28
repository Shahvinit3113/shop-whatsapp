import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverErrorResponse } from '@/lib/errors';
import { sendWhatsAppMessage, sendWhatsAppButtons } from '@/lib/whatsapp';
import { detectCakeIntent } from '@/utils/detectCakeIntent';

// GET /api/webhooks/whatsapp — Webhook verification (challenge response)
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify token (should be configured in env)
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'cakeshop-webhook-verify';

    if (mode === 'subscribe' && token === verifyToken) {
        return new NextResponse(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

// POST /api/webhooks/whatsapp — Receive incoming messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Incoming WhatsApp Webhook Payload:', JSON.stringify(body, null, 2));

        // WhatsApp Cloud API message structure
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value?.messages) {
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        }

        const phoneNumberId = value.metadata?.phone_number_id;

        for (const message of value.messages) {
            const from = message.from; // Sender phone number
            const messageBody = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
            const messageId = message.id;

            // 1. Identify Shop
            const shop = await prisma.shop.findFirst({
                where: { whatsappPhoneNumberId: phoneNumberId },
            });

            if (!shop || !shop.whatsappAccessToken) {
                console.error(`Shop not found or not configured for phone number ID: ${phoneNumberId}`);
                continue;
            }

            // 2. Identify/Create Customer
            let customer = await prisma.customer.findFirst({
                where: {
                    shopId: shop.id,
                    phone: { contains: from.slice(-10) },
                },
            });

            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        shopId: shop.id,
                        name: value.contacts?.[0]?.profile?.name || 'WhatsApp Customer',
                        phone: from,
                    },
                });
            }

            // 3. Manage Conversation State
            let state = await prisma.conversationState.findUnique({
                where: { shopId_phone: { shopId: shop.id, phone: from } }
            });

            if (!state) {
                state = await prisma.conversationState.create({
                    data: {
                        shopId: shop.id,
                        phone: from,
                        step: 'INITIAL',
                        orderData: {},
                    }
                });
            }

            // 4. State Machine Logic
            interface OrderStateData {
                [key: string]: string | number | boolean | null | undefined;
                cakeId?: string;
                cakeName?: string;
                price?: number;
                pickupTime?: string;
                notes?: string;
            }
            const orderData = (state.orderData as unknown as OrderStateData) || {};

            switch (state.step) {
                case 'INITIAL':
                    const hasCakeIntent = detectCakeIntent(messageBody);
                    
                    console.log('--- Incoming Request ---');
                    console.log(`Message: "${messageBody}"`);
                    console.log(`Detected Intent: ${hasCakeIntent ? 'Cake Related' : 'Generic'}`);

                    if (!hasCakeIntent) {
                        console.log(`Response Type Sent: Generic Greeting`);
                        await sendWhatsAppMessage(
                            shop.whatsappAccessToken,
                            shop.whatsappPhoneNumberId!,
                            from,
                            `Welcome to ${shop.name} 🎂\nPlease tell us what type of cake you are looking for.`,
                            shop.id
                        );
                        break;
                    }

                    console.log(`Response Type Sent: Cake Menu`);
                    // Fetch available cakes.
                    const cakes = await prisma.cake.findMany({
                        where: { shopId: shop.id, isActive: true },
                        take: 3
                    });

                    if (cakes.length === 0) {
                        await sendWhatsAppMessage(shop.whatsappAccessToken, shop.whatsappPhoneNumberId!, from, `Welcome to ${shop.name}! Currently, we don't have any cakes listed. Please check back later.`, shop.id);
                        break;
                    }

                    let menuText = `🍰 Cake Menu\n\n`;
                    cakes.forEach((cake, index) => {
                        menuText += `${index + 1}. ${cake.name} - ₹${cake.price}/kg\n`;
                    });
                    menuText += `\nReply with number to continue.`;

                    await sendWhatsAppMessage(
                        shop.whatsappAccessToken,
                        shop.whatsappPhoneNumberId!,
                        from,
                        menuText,
                        shop.id
                    );

                    await prisma.conversationState.update({
                        where: { id: state.id },
                        data: { step: 'AWAITING_FLAVOR' }
                    });
                    break;

                case 'AWAITING_FLAVOR':
                    // Customer selected/typed a cake
                    const selectedIndex = parseInt(messageBody.trim(), 10);
                    let selectedCake = null;

                    if (!isNaN(selectedIndex) && selectedIndex > 0) {
                        // Re-fetch the cakes to get the selected one by number
                        const cakesList = await prisma.cake.findMany({
                            where: { shopId: shop.id, isActive: true },
                            take: 3
                        });
                        selectedCake = cakesList[selectedIndex - 1];
                    }

                    if (!selectedCake) {
                        selectedCake = await prisma.cake.findFirst({
                            where: {
                                shopId: shop.id,
                                OR: [
                                    { name: { equals: messageBody, mode: 'insensitive' } },
                                    { id: message.interactive?.button_reply?.id }
                                ]
                            }
                        });
                    }

                    if (!selectedCake) {
                        await sendWhatsAppMessage(shop.whatsappAccessToken, shop.whatsappPhoneNumberId!, from, "I couldn't find that cake. Please select from the options provided.", shop.id);
                        break;
                    }

                    orderData.cakeId = selectedCake.id;
                    orderData.cakeName = selectedCake.name;
                    orderData.price = selectedCake.price;

                    await sendWhatsAppMessage(shop.whatsappAccessToken, shop.whatsappPhoneNumberId!, from, `Great choice! ${selectedCake.name} it is.\n\nWhen would you like to pick it up? (e.g., Tomorrow at 5pm)`, shop.id);

                    await prisma.conversationState.update({
                        where: { id: state.id },
                        data: {
                            step: 'AWAITING_TIME',
                            orderData: orderData
                        }
                    });
                    break;

                case 'AWAITING_TIME':
                    orderData.pickupTime = messageBody;

                    await sendWhatsAppMessage(shop.whatsappAccessToken, shop.whatsappPhoneNumberId!, from, "Got it! Any special message or instructions for the cake? (Type 'None' if none)", shop.id);

                    await prisma.conversationState.update({
                        where: { id: state.id },
                        data: {
                            step: 'AWAITING_MESSAGE',
                            orderData: orderData
                        }
                    });
                    break;

                case 'AWAITING_MESSAGE':
                    orderData.notes = messageBody === 'None' ? '' : messageBody;

                    const summary = `*Order Summary* 📋\n\n` +
                        `🎂 *Cake:* ${orderData.cakeName}\n` +
                        `⏰ *Pickup:* ${orderData.pickupTime}\n` +
                        `📝 *Note:* ${orderData.notes || 'None'}\n` +
                        `💰 *Total:* ₹${orderData.price}\n\n` +
                        `Shall I confirm this order?`;

                    await sendWhatsAppButtons(
                        shop.whatsappAccessToken,
                        shop.whatsappPhoneNumberId!,
                        from,
                        summary,
                        [
                            { id: 'CONFIRM_YES', title: 'Confirm ✅' },
                            { id: 'CONFIRM_NO', title: 'Cancel ❌' }
                        ],
                        shop.id
                    );

                    await prisma.conversationState.update({
                        where: { id: state.id },
                        data: {
                            step: 'AWAITING_CONFIRMATION',
                            orderData: orderData
                        }
                    });
                    break;

                case 'AWAITING_CONFIRMATION':
                    if (messageBody.includes('Confirm') || message.interactive?.button_reply?.id === 'CONFIRM_YES') {
                        // Create actual order
                        const orderNumber = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

                        const order = await prisma.order.create({
                            data: {
                                shopId: shop.id,
                                customerId: customer.id,
                                orderNumber,
                                totalAmount: orderData.price,
                                status: 'CONFIRMED',
                                paymentStatus: 'PENDING',
                                notes: orderData.notes,
                                // Note: pickupTime is a DateTime in schema, but a string here. 
                                // For MVP, we'll store it as string in notes if parsing fails or just ignore for now
                            }
                        });

                        await prisma.orderItem.create({
                            data: {
                                shopId: shop.id,
                                orderId: order.id,
                                cakeId: orderData.cakeId!,
                                quantity: 1,
                                price: orderData.price!
                            }
                        });

                        await sendWhatsAppMessage(
                            shop.whatsappAccessToken,
                            shop.whatsappPhoneNumberId!,
                            from,
                            `✅ *Order Confirmed!*\n\nYour order number is *${orderNumber}*.\nWe'll notify you when it's ready.\n\nYou can pay ₹${orderData.price! / 2} (50% advance) to confirm via UPI: shop@upi`,
                            shop.id
                        );

                        await prisma.conversationState.delete({
                            where: { id: state.id }
                        });
                    } else {
                        await sendWhatsAppMessage(shop.whatsappAccessToken, shop.whatsappPhoneNumberId!, from, "Order cancelled. You can start a new order anytime by saying Hi!", shop.id);
                        await prisma.conversationState.delete({
                            where: { id: state.id }
                        });
                    }
                    break;

                default:
                    await prisma.conversationState.update({
                        where: { id: state.id },
                        data: { step: 'INITIAL' }
                    });
                    break;
            }

            // Log the message
            await prisma.whatsAppMessage.create({
                data: {
                    shopId: shop?.id || null,
                    from,
                    to: phoneNumberId || '',
                    body: messageBody,
                    messageId,
                },
            });
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
        console.error('Webhook Error:', error);
        await prisma.errorLog.create({
            data: {
                errorType: 'WEBHOOK_ERROR',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            }
        }).catch(e => console.error('Failed to log webhook error:', e));
        return serverErrorResponse(error);
    }
}
