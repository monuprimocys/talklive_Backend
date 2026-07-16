const { RekognitionClient, DetectModerationLabelsCommand } = require("@aws-sdk/client-rekognition");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_DEFAULT_REGION === "auto" ? "us-east-1" : (process.env.AWS_DEFAULT_REGION || "us-east-1"),
    credentials: {
        accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
        secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    },
});

// Note: AWS Rekognition is an AWS service. If the user is using Cloudflare R2 for storage, 
// they still need an AWS account for Rekognition. 
// The credentials provided in the prompt seem to be for AWS (AKIA...).

/**
 * Moderates an image using AWS Rekognition
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @returns {Promise<{isSafe: boolean, labels: string[]}>}
 */
const moderateImage = async (imageBuffer) => {
    try {
        const command = new DetectModerationLabelsCommand({
            Image: {
                Bytes: imageBuffer,
            },
            MinConfidence: 10, // Even lower for maximum safety
        });

        const response = await rekognitionClient.send(command);
        console.log("Rekognition Labels Found:", JSON.stringify(response.ModerationLabels, null, 2));

        if (response.ModerationLabels && response.ModerationLabels.length > 0) {
            return {
                isSafe: false,
                labels: response.ModerationLabels.map(label => label.Name),
            };
        }

        return { isSafe: true };
    } catch (error) {
        console.error("Rekognition Moderation Error:", error);
        throw error;
    }
};

/**
 * Moderates a video by extracting frames and checking them as images.
 * @param {string} videoPath - Path to the video file on disk
 * @returns {Promise<{isSafe: boolean, labels: string[]}>}
 */
const moderateVideo = async (videoPath) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-moderation-'));
    try {
        // Extract 3 frames from the video (at 25%, 50%, and 75% of duration)
        // This is a balance between speed and coverage.
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    count: 3,
                    folder: tempDir,
                    size: '640x?',
                    filename: 'frame-%i.jpg'
                })
                .on('end', resolve)
                .on('error', reject);
        });

        const frames = await fs.readdir(tempDir);
        for (const frame of frames) {
            const framePath = path.join(tempDir, frame);
            const buffer = await fs.readFile(framePath);
            const result = await moderateImage(buffer);

            if (!result.isSafe) {
                return result; // Found unsafe content in one of the frames
            }
        }

        return { isSafe: true };
    } catch (error) {
        console.error("Video Moderation Error:", error);
        // If ffmpeg fails (e.g. invalid video), we might want to log and proceed
        // or block. For now, we'll return safe to avoid blocking valid uploads
        // if ffmpeg has issues with specific codecs.
        return { isSafe: true };
    } finally {
        // Clean up temp frames
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    }
};

module.exports = { moderateImage, moderateVideo };
