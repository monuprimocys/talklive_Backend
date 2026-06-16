const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");

// ✅ R2 CONFIG
const client = new S3Client({
    region: "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    forcePathStyle: true,
    // ✅ Disable flexible checksums for R2 compatibility (Fixes CORS/Signature issues)
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
});

// ✅ BASE FOLDER
const BASE_PATH = "TokLive/uploads_v2";


// ✅ EXTENSION DETECTOR (MAIN FIX)

function getExtension(mimeType = "", originalName = "") {
    // 1. From original file name
    if (originalName && originalName.includes(".")) {
        const ext = originalName.split(".").pop();
        if (ext) return ext.toLowerCase();
    }

    // 2. From MIME type
    if (mimeType) {
        // remove parameters like charset=utf-8
        const cleanMime = mimeType.split(";")[0];

        // take subtype (after /)
        const parts = cleanMime.split("/");

        if (parts.length === 2) {
            let ext = parts[1].toLowerCase();

            // remove vendor prefixes like vnd., x-
            ext = ext.replace(/^x-/, "").replace(/^vnd\./, "");

            // handle special cases cleanup
            if (ext.includes("jpeg")) return "jpg";

            return ext;
        }
    }

    // 3. No fallback like "bin"
    return "unknown"; // or return ""
}


// ✅ PRESIGNED URL (Frontend Upload)
async function getPresignedUploadUrl(folderPath = "others", fileType = "file", mimeType = "", originalName = "") {
    try {
        const timestamp = Date.now();
        const ext = getExtension(mimeType, originalName);

        let fileName;
        if (fileType === "thumb" || mimeType.startsWith("image/")) {
            fileName = `thumb_${timestamp}.${ext}`;
        } else if (fileType === "video" || mimeType.startsWith("video/")) {
            fileName = `video_${timestamp}.${ext}`;
        } else {
            fileName = `file_${timestamp}.${ext}`;
        }

        // Combine BASE_PATH with the specific folderPath
        const key = `${BASE_PATH}/${folderPath}/${fileName}`.replace(/\/+/g, '/');

        // ✅ IMPORTANT: For R2, we include ContentType in the command 
        // but we need to ensure the frontend sends it exactly.
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key,
            ContentType: mimeType || "application/octet-stream",
        });

        const presignedUrl = await getSignedUrl(client, command, {
            expiresIn: 3600,
            // ✅ Explicitly sign the Content-Type header
            unhoistedableHeaders: new Set(["content-type"]),
        });

        return {
            presignedUrl,
            fileUrl: `${process.env.AWS_ITEM_BASE_URL}${key}`.replace(/([^:]\/)\/+/g, "$1"),
            key,
            fileName
        };

    } catch (error) {
        console.error("Presigned URL Error:", error);
        throw error;
    }
}


// ✅ DIRECT UPLOAD (Multer)
async function uploadFileToS3(file, folderPath = "others") {
    try {
        const timestamp = Date.now();
        const ext = getExtension(file.mimetype, file.originalname);

        let fileName;
        if (file.mimetype.startsWith("image/")) {
            fileName = `thumb_${timestamp}.${ext}`;
        } else if (file.mimetype.startsWith("video/")) {
            fileName = `video_${timestamp}.${ext}`;
        } else {
            fileName = `file_${timestamp}.${ext}`;
        }

        const key = `${BASE_PATH}/${folderPath}/${fileName}`.replace(/\/+/g, '/');

        const fileContent = fs.readFileSync(file.path);

        await client.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key,
            Body: fileContent,
            ContentType: file.mimetype || "application/octet-stream",
            ContentDisposition: "inline"
        }));

        // delete temp file
        fs.unlinkSync(file.path);

        return `${process.env.AWS_ITEM_BASE_URL}${key}`.replace(/([^:]\/)\/+/g, "$1");

    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
}


// ✅ DELETE FILE
async function deleteFileFromS3(key) {
    try {
        if (!key) return false;
        await client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key
        }));
        return true;
    } catch (error) {
        console.error("Delete Error:", error);
        return false;
    }
}


module.exports = {
    uploadFileToS3,
    getPresignedUploadUrl,
    deleteFileFromS3
};
