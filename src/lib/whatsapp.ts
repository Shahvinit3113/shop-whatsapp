import axios from 'axios';
import { prisma } from './prisma';

const WHATSAPP_API_VERSION = 'v20.0';

export async function sendWhatsAppMessage(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    message: string | object,
    shopId?: string
) {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

    const data = typeof message === 'string' 
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: message },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            ...message
          };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        // Log the outgoing message to the database if shopId is provided
        if (shopId) {
            const bodyText = typeof message === 'string' ? message : JSON.stringify(message);
            await prisma.whatsAppMessage.create({
                data: {
                    shopId,
                    from: phoneNumberId,
                    to,
                    body: bodyText,
                    messageId: response.data.messages?.[0]?.id,
                }
            });
        }

        return response.data;
    } catch (error) {
        let errorMessage = 'Unknown WhatsApp API Error';
        if (axios.isAxiosError(error)) {
            errorMessage = JSON.stringify(error.response?.data || error.message);
            console.error('WhatsApp API Error:', error.response?.data || error.message);
        } else {
            errorMessage = error instanceof Error ? error.message : String(error);
            console.error('WhatsApp API Error:', errorMessage);
        }
        
        // Log to ErrorLog if shopId is provided
        if (shopId) {
            await prisma.errorLog.create({
                data: {
                    shopId,
                    errorType: 'WHATSAPP_API_ERROR',
                    message: `Failed to send message to ${to}: ${errorMessage}`,
                    stack: error instanceof Error ? error.stack : undefined,
                }
            }).catch(e => console.error('Failed to save ErrorLog:', e));
        }

        throw error;
    }
}

export async function sendWhatsAppButtons(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    text: string,
    buttons: Array<{ id: string, title: string }>,
    shopId?: string
) {
    const message = {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text },
            action: {
                buttons: buttons.map(button => ({
                    type: 'reply',
                    reply: {
                        id: button.id,
                        title: button.title
                    }
                }))
            }
        }
    };

    return sendWhatsAppMessage(accessToken, phoneNumberId, to, message, shopId);
}
