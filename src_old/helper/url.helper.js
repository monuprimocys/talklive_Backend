
/**
 * Formats a media URL based on whether it's an absolute URL (S3/R2/CDN) or a local path.
 * 
 * @param {string} rawUrl - The raw URL or path from the database.
 * @param {string} defaultImage - Optional default image if rawUrl is empty.
 * @returns {string} - The formatted absolute URL.
 */
const formatMediaUrl = (rawUrl, defaultImage = "") => {
    // 1. Empty check
    if (!rawUrl) {
        if (defaultImage) {
            const baseUrl = (process.env.baseUrl || "").replace(/\/$/, "");
            return `${baseUrl}/${defaultImage.replace(/^\//, "")}`;
        }
        return "";
    }

    // 2. Already full URL check (S3 / CloudFront / R2 / any CDN / external)
    if (
        rawUrl.includes("amazonaws.com") ||
        rawUrl.includes("cloudfront.net") ||
        rawUrl.includes("r2.cloudflarestorage.com") ||
        rawUrl.includes("cloudflarestorage.com") ||
        rawUrl.startsWith("http://") ||
        rawUrl.startsWith("https://")
    ) {
        return rawUrl;
    }

    // 3. Local path formatting
    const baseUrl = (process.env.baseUrl || "").replace(/\/$/, "");
    const path = rawUrl.replace(/^\//, "");

    return `${baseUrl}/${path}`;
};

module.exports = { formatMediaUrl };
