import axios from 'axios';

const WHATSAPP_API_VERSION = 'v20.0';

export async function sendWhatsAppMessage(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    message: string | object
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
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('WhatsApp API Error:', error.response?.data || error.message);
        } else {
            console.error('WhatsApp API Error:', error instanceof Error ? error.message : String(error));
        }
        throw error;
    }
}

export async function sendWhatsAppButtons(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    text: string,
    buttons: Array<{ id: string, title: string }>
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

    return sendWhatsAppMessage(accessToken, phoneNumberId, to, message);
}
