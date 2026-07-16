const axios = require("axios");

class RevenueCatService {
    static API_BASE_URL = "https://api.revenuecat.com/v1";

    static getSecretKey() {
        return process.env.REVENUECAT_SECRET_KEY;
    }

    static getSdkKey() {
        return process.env.REVENUECAT_SDK_KEY;
    }

    /**
     * Fetch subscriber info from RevenueCat using Secret Key
     */
    static async getSubscriberInfo(appUserId) {
        const secretKey = this.getSecretKey();
        if (!secretKey) {
            console.warn("[RevenueCatService] REVENUECAT_SECRET_KEY is not set");
            return null;
        }

        try {
            const response = await axios.get(`${this.API_BASE_URL}/subscribers/${appUserId}`, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.subscriber;
        } catch (error) {
            console.error(`[RevenueCatService] Error fetching subscriber ${appUserId}:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Fetch offerings from RevenueCat using the Public SDK Key
     */
    static async getOfferings(appUserId) {
        const sdkKey = this.getSdkKey();
        if (!sdkKey) {
            console.warn("[RevenueCatService] REVENUECAT_SDK_KEY is not set");
            return null;
        }

        try {
            const response = await axios.get(`${this.API_BASE_URL}/subscribers/${appUserId}/offerings`, {
                headers: {
                    Authorization: `Bearer ${sdkKey}`,
                    "Content-Type": "application/json",
                    "X-Platform": "android",
                },
            });

            return response.data;
        } catch (error) {
            console.error(`[RevenueCatService] Error fetching offerings for ${appUserId}:`, error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = { RevenueCatService };
