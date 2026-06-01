const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("Using Bucket:", process.env.AWS_BUCKET);

const client = new S3Client({
    region: "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

async function setCors() {
    try {
        const command = new PutBucketCorsCommand({
            Bucket: process.env.AWS_BUCKET,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedOrigins: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        AllowedHeaders: ["*"],
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        });

        await client.send(command);
        console.log("✅ CORS policy updated successfully!");
    } catch (error) {
        console.error("❌ Error updating CORS policy:", error);
    }
}

setCors();
