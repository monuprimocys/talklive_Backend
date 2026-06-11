const { RekognitionClient, DetectModerationLabelsCommand } = require("@aws-sdk/client-rekognition");
const fs = require("fs");
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
        const imagePath = "/home/monu-ji/.gemini/antigravity/brain/024628a6-35eb-4e61-aa35-d1965802b035/uploaded_image_1781185397367.png";
        const buffer = fs.readFileSync(imagePath);

        console.log("Moderating image:", imagePath);
        console.log("Buffer size:", buffer.length);

        const command = new DetectModerationLabelsCommand({
            Image: {
                Bytes: buffer,
            },
            MinConfidence: 20,
        });

        const response = await rekognitionClient.send(command);
        console.log("Labels found:", JSON.stringify(response.ModerationLabels, null, 2));

        if (response.ModerationLabels.length > 0) {
            console.log("RESULT: UNSAFE");
        } else {
            console.log("RESULT: SAFE");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
