const { RekognitionClient, DetectModerationLabelsCommand } = require("@aws-sdk/client-rekognition");
const dotenv = require("dotenv").config();

const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_DEFAULT_REGION === "auto" ? "us-east-1" : (process.env.AWS_DEFAULT_REGION || "us-east-1"),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function test() {
    try {
        console.log("Testing Rekognition with credentials...");
        console.log("Region:", process.env.AWS_DEFAULT_REGION);
        console.log("Access Key ID:", process.env.AWS_ACCESS_KEY_ID ? "PRESENT" : "MISSING");

        const command = new DetectModerationLabelsCommand({
            Image: {
                Bytes: Buffer.from([]), // Empty buffer just to test connection
            },
        });
        await rekognitionClient.send(command);
    } catch (error) {
        console.log("Test Result:", error.name);
        if (error.name === "SerializationException") {
            console.log("Connection successful (got SerializationException because of empty buffer)");
        } else {
            console.error("Connection failed:", error);
        }
    }
}

test();
