const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const axios = require('axios');
const { moderateImage, moderateVideo } = require('../service/common/moderationService');
const { generalResponse } = require('../helper/response.helper');
const { deleteFileFromS3 } = require('../service/common/s3.service');

/**
 * Middleware to moderate uploaded images using AWS Rekognition.
 * Handles both req.file (single) and req.files (array or fields).
 */
const moderationMiddleware = async (req, res, next) => {
    try {
        console.log(`Moderation check started for: ${req.method} ${req.path}`);
        const filesToCheck = [];

        // Collect all files from req.file and req.files
        if (req.file) {
            filesToCheck.push(req.file);
        }

        if (req.files) {
            if (Array.isArray(req.files)) {
                filesToCheck.push(...req.files);
            } else if (typeof req.files === 'object') {
                Object.values(req.files).forEach(fileArray => {
                    if (Array.isArray(fileArray)) {
                        filesToCheck.push(...fileArray);
                    } else {
                        filesToCheck.push(fileArray);
                    }
                });
            }
        }

        // Handle S3 URLs in req.body if no physical files are present
        const urlsToCheck = [];
        if (process.env.MEDIAFLOW === "S3") {
            let i = 1;
            while (req.body[`file_media_${i}`]) {
                urlsToCheck.push(req.body[`file_media_${i}`]);
                i++;
            }
            // Also check single 'file' field if it's a URL
            if (req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('http')) {
                urlsToCheck.push(req.body.file);
            }
        }

        console.log(`Files to check for moderation: ${filesToCheck.length}`);
        for (const file of filesToCheck) {
            console.log(`Checking file: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);
            let result = { isSafe: true };

            // Check Images
            if (file.mimetype && file.mimetype.startsWith('image/')) {
                let buffer = file.buffer;
                if (!buffer && file.path) {
                    try {
                        console.log(`Reading image from path: ${file.path}`);
                        buffer = await fs.readFile(file.path);
                        console.log(`Image read successful, buffer size: ${buffer.length} bytes`);
                    } catch (readErr) {
                        console.error(`Error reading image for moderation: ${file.path}`, readErr);
                        continue;
                    }
                }

                if (buffer) {
                    result = await moderateImage(buffer);
                }
            }
            // Check Videos
            else if (file.mimetype && file.mimetype.startsWith('video/')) {
                if (file.path) {
                    result = await moderateVideo(file.path);
                } else if (file.buffer) {
                    const tempVideoPath = path.join(os.tmpdir(), `temp-${Date.now()}-${file.originalname}`);
                    await fs.writeFile(tempVideoPath, file.buffer);
                    result = await moderateVideo(tempVideoPath);
                    await fs.unlink(tempVideoPath).catch(() => { });
                }
            }

            if (!result.isSafe) {
                // If unsafe content is detected, reject the upload
                console.warn(`Unsafe content detected in file: ${file.originalname || 'unknown'}. Labels: ${result.labels.join(', ')}`);

                // Clean up: delete ALL files from disk that were uploaded in this request
                for (const f of filesToCheck) {
                    if (f.path) {
                        await fs.unlink(f.path).catch(err => console.error("Error deleting file during cleanup:", err));
                    }
                }

                return generalResponse(
                    res,
                    { unsafe: true, labels: result.labels },
                    "Upload rejected: Unsafe content detected.",
                    false,
                    true,
                    400
                );
            }
        }

        // Check URLs
        for (const url of urlsToCheck) {
            console.log(`Checking URL for moderation: ${url}`);
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');
                const contentType = response.headers['content-type'];

                let result = { isSafe: true };
                if (contentType && contentType.startsWith('image/')) {
                    result = await moderateImage(buffer);
                } else if (contentType && contentType.startsWith('video/')) {
                    // For videos in S3, we'd need to download and process. 
                    // This might be slow. For now, we'll focus on images.
                    // result = await moderateVideo(url); 
                }

                if (!result.isSafe) {
                    console.warn(`Unsafe content detected in URL: ${url}. Labels: ${result.labels.join(', ')}`);

                    // Clean up: delete from S3 if it's an S3 URL
                    if (url.includes(process.env.AWS_ITEM_BASE_URL)) {
                        const key = url.replace(process.env.AWS_ITEM_BASE_URL, '');
                        await deleteFileFromS3(key);
                        console.log(`Deleted unsafe file from S3: ${key}`);
                    }

                    return generalResponse(
                        res,
                        { unsafe: true, labels: result.labels },
                        "Upload rejected: Unsafe content detected in the media URL.",
                        false,
                        true,
                        400
                    );
                }
            } catch (urlErr) {
                console.error(`Error downloading URL for moderation: ${url}`, urlErr.message);
            }
        }

        // If all files are safe or no images were found, continue
        next();
    } catch (error) {
        console.error("CRITICAL: Moderation Middleware Error:", error);
        // In case of an error in the moderation process itself (e.g., AWS credentials, network),
        // we choose to let the request proceed to avoid breaking existing functionality.
        // This can be adjusted based on how strict the requirements are.
        next();
    }
};

module.exports = { moderationMiddleware };
