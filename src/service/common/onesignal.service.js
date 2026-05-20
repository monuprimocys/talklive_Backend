// services/oneSignalService.js
require('dotenv').config();

const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY;
const ANDROID_CHANNEL_ID = process.env.ANDROID_CHANNEL_ID;

/**
 * Sends push notification via OneSignal REST API (HTTP POST)
 * 
 * @param {Object} params
 * @param {string[]} [params.playerIds] - Array of player IDs to target (optional)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body
 * @param {string} [params.big_picture] - Optional image URL for rich notifications
 * @param {string} [params.large_icon] - Optional image URL for rich notifications
 * @param {string} [params.appLogo] - Optional small icon filename or URL
 * @param {Object} [params.data] - Optional custom data payload
 */
async function sendPushNotification({
    playerIds,
    title,
    message,
    big_picture,
    large_icon,
    appLogo = "",
    data = {},
    broadcast = false
}) {
    
    playerIds = playerIds?.filter((id) => id != "" && id);
    const notification = {
        app_id: ONE_SIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        data,
        small_icon: appLogo,
        android_channel_id:ANDROID_CHANNEL_ID
    };
    
    if (playerIds && playerIds.length > 0) {
        
        notification.include_player_ids = playerIds;
    } else if (broadcast) {
        notification.included_segments = ['All'];
    }
    if (large_icon) {
        notification.chrome_web_image = large_icon;
        notification.large_icon = large_icon;
        notification.ios_attachments = { id1: large_icon };
    }
    if (big_picture) {
        notification.big_picture = big_picture; // Android
        notification.ios_attachments = {
            ...(notification.ios_attachments || {}),
            id2: big_picture // This may override in iOS if not handled properly by NSE
        };
    }

    try {
        
        
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification),
        });
        
        return response.data;
    } catch (error) {
        console.error('OneSignal API error:', error.response?.data || error.message || error);
        // throw new Error('Failed to send notification');
    }
}



module.exports = {
    sendPushNotification,
};
