// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const fs = require("fs");

// // ✅ R2 CONFIG
// const client = new S3Client({
//     region: "auto",
//     endpoint: process.env.AWS_ENDPOINT,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//     },
//     forcePathStyle: true
// });

// // ✅ FIXED BASE PATH
// const BASE_PATH = "TokLive/uploads_v2";

// // ✅ Generate presigned URL (Frontend upload)
// async function getPresignedUploadUrl(fileType = "video", mimeType = "video/mp4") {
//     try {
//         const timestamp = Date.now();
//         let ext = "mp4";

//         // detect extension
//         if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
//         else if (mimeType.includes("png")) ext = "png";
//         else if (mimeType.includes("webp")) ext = "webp";
//         else if (mimeType.includes("webm")) ext = "webm";
//         else if (mimeType.includes("mov") || mimeType.includes("quicktime")) ext = "mov";

//         // file naming
//         let fileName;
//         if (fileType === "thumb" || mimeType.startsWith("image/")) {
//             fileName = `thumb_${timestamp}.${ext}`;
//         } else if (fileType === "video" || mimeType.startsWith("video/")) {
//             fileName = `video_${timestamp}.${ext}`;
//         } else {
//             fileName = `file_${timestamp}.${ext}`;
//         }

//         // ✅ FINAL KEY PATH
//         const key = `${BASE_PATH}/${fileName}`;

//         const params = {
//             Bucket: process.env.AWS_BUCKET,
//             Key: key,
//             ContentType: mimeType,
//         };

//         const command = new PutObjectCommand(params);

//         const presignedUrl = await getSignedUrl(client, command, {
//             expiresIn: 3600
//         });

//         // ✅ CDN URL
//         const fileUrl = `${process.env.AWS_ITEM_BASE_URL}${key}`;

//         return {
//             presignedUrl,
//             fileUrl,
//             key,
//             fileName
//         };

//     } catch (error) {
//         console.error("Error generating presigned URL:", error);
//         throw error;
//     }
// }

// // ✅ Direct upload (multer)
// async function uploadFileToS3(file, fileType = "file") {
//     try {
//         const timestamp = Date.now();
//         const ext = file.originalname.split('.').pop();

//         let fileName;
//         if (fileType === "thumb" || file.mimetype.startsWith("image/")) {
//             fileName = `thumb_${timestamp}.${ext}`;
//         } else if (fileType === "video" || file.mimetype.startsWith("video/")) {
//             fileName = `video_${timestamp}.${ext}`;
//         } else {
//             fileName = `file_${timestamp}.${ext}`;
//         }

//         // ✅ FINAL KEY PATH
//         const key = `${BASE_PATH}/${fileName}`;

//         const fileContent = fs.readFileSync(file.path);

//         const params = {
//             Bucket: process.env.AWS_BUCKET,
//             Key: key,
//             Body: fileContent,
//             ContentType: file.mimetype,
//             ContentDisposition: "inline"
//         };

//         const command = new PutObjectCommand(params);
//         await client.send(command);

//         // delete temp file
//         fs.unlinkSync(file.path);

//         // ✅ return CDN URL
//         return `${process.env.AWS_ITEM_BASE_URL}${key}`;

//     } catch (error) {
//         console.error("Error uploading file to R2:", error);
//         throw error;
//     }
// }

// module.exports = {
//     uploadFileToS3,
//     getPresignedUploadUrl
// };




const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
    forcePathStyle: true
});

// ✅ BASE FOLDER
const BASE_PATH = "TokLive/uploads_v2";


// ✅ EXTENSION DETECTOR (MAIN FIX)
function getExtension(mimeType = "", originalName = "") {
    // 1. Try from original filename
    if (originalName) {
        const ext = originalName.split(".").pop();
        if (ext) return ext.toLowerCase();
    }

    // 2. Fallback using mimeType
    if (!mimeType) return "bin";

    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("mov") || mimeType.includes("quicktime")) return "mov";

    return "bin";
}


// ✅ PRESIGNED URL (Frontend Upload)
async function getPresignedUploadUrl(fileType = "file", mimeType = "", originalName = "") {
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

        const key = `${BASE_PATH}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key,
            ContentType: mimeType || "application/octet-stream",
        });

        const presignedUrl = await getSignedUrl(client, command, {
            expiresIn: 3600
        });

        return {
            presignedUrl,
            fileUrl: `${process.env.AWS_ITEM_BASE_URL}${key}`,
            key,
            fileName
        };

    } catch (error) {
        console.error("Presigned URL Error:", error);
        throw error;
    }
}


// ✅ DIRECT UPLOAD (Multer)
async function uploadFileToS3(file, fileType = "file") {
    try {
        const timestamp = Date.now();

        const ext = getExtension(file.mimetype, file.originalname);

        let fileName;

        if (fileType === "thumb" || file.mimetype.startsWith("image/")) {
            fileName = `thumb_${timestamp}.${ext}`;
        } else if (fileType === "video" || file.mimetype.startsWith("video/")) {
            fileName = `video_${timestamp}.${ext}`;
        } else {
            fileName = `file_${timestamp}.${ext}`;
        }

        const key = `${BASE_PATH}/${fileName}`;

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

        return `${process.env.AWS_ITEM_BASE_URL}${key}`;

    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
}


module.exports = {
    uploadFileToS3,
    getPresignedUploadUrl
};