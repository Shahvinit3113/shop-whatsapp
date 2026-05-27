export function detectCakeIntent(message: string): boolean {
    if (!message) return false;

    // Normalize message: lowercase and remove extra spaces
    const normalizedMessage = message.trim().toLowerCase();

    // List of cake-related keywords
    const cakeKeywords = [
        'cake',
        'pastry',
        'birthday',
        'chocolate',
        'red velvet',
        'pineapple',
        'order',
        'want',
        '1kg',
        'half kg',
        'kg',
        'pound',
        'anniversary'
    ];

    // Check if the message contains any of the cake-related keywords
    return cakeKeywords.some(keyword => normalizedMessage.includes(keyword));
}
