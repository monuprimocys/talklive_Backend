const axios = require("axios");
const getmac = require("getmac").default;
const os = require("os");

/**
 * Translates text using the external FastAPI translation API.
 * @param {Object} requestData - The data to send to the translation API.
 * @returns {Promise<string>} - Returns the translated text or throws an error.
 */
 async function translateText(requestData) {
    const apiUrl = "http://62.72.36.245:3692/translate/";
    
    try {
        const response = await axios.post(apiUrl, requestData);
        return response.data.translated_data;
    } catch (error) {
        console.error("Translation API error:", error.message);
        throw new Error("Translation failed");
    }
}

async function getWordTranslation(terget_language  , word , key_id) {
    try {

        const requestData = {
            json_data: { [key_id]: word },
            target_language: terget_language,
        };
        const res = await translateText(requestData)
        return res
    } catch (error) {
        console.error('Error fetching Language Translation:', error);
        throw error;

    }
}





function getUserDetails() {
    try {
        const mac = getmac();
        
        return mac;
    } catch (err) {
        console.error("Error fetching User details:", err);
        return null;
    }
}

function getUserRequestDetails() {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaceName in networkInterfaces) {
        for (const interface of networkInterfaces[interfaceName]) {
            // Check for IPv4 and non-internal addresses (to exclude localhost)
            if (interface.family === "IPv4" && !interface.internal) {
                return interface.address;
            }
        }
    }

    return "Request details not found";
}
module.exports = {
    translateText,
    getWordTranslation,
    getUserDetails,
    getUserRequestDetails
}
