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
    // appLogo = "",
    data = {},
    broadcast = false
}) {

    playerIds = playerIds?.filter((id) => id);


    console.log("ANDROID_CHANNEL_ID" , ANDROID_CHANNEL_ID)
    console.log("playerIds" , playerIds)


    const notification = {
        app_id: ONE_SIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        data,
        // small_icon: appLogo,
        android_channel_id: ANDROID_CHANNEL_ID
    };

    if (playerIds?.length > 0) {
        notification.include_player_ids = playerIds;
    } else if (broadcast) {
        notification.included_segments = ['All'];
    } else {
        console.log("❌ No target specified");
        return;
    }

    if (large_icon) {
        notification.large_icon = large_icon;
    }

    if (big_picture) {
        notification.big_picture = big_picture;
    }

    console.log("notification", notification);

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification),
        });

        const result = await response.json();

        console.log("✅ Status:", response.status);
        console.log("✅ Result:", result);

        return result;

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}



module.exports = {
    sendPushNotification,
};
