const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

ffmpeg.setFfmpegPath(ffmpegPath);

const client = new S3Client({
  region: "auto",
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

// const QUALITIES = [
//   { label: "360p", size: "640x360" },
//   { label: "480p", size: "854x480" },
//   { label: "720p", size: "1280x720" },
// ];

const QUALITIES = [
  { label: "360p", width: 640 },
  { label: "480p", width: 854 },
  { label: "720p", width: 1280 },
];

// Download file from URL to local temp path
const downloadFromUrl = (url, destPath) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadFromUrl(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(destPath);
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => { });
      reject(err);
    });
  });
};

// Upload local file to S3
const uploadLocalFileToS3 = async (localPath, folderPath, fileName) => {
  const fileContent = fs.readFileSync(localPath);
  const key = `${folderPath}/${fileName}`.replace(/\/+/g, '/');

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: "video/mp4",
    ContentDisposition: "inline",
  };

  const command = new PutObjectCommand(params);
  await client.send(command);

  // Delete local file after upload
  fs.unlinkSync(localPath);

  return `${process.env.AWS_ITEM_BASE_URL}${key}`.replace(/([^:]\/)\/+/g, "$1");
};

// Generate qualities for LOCAL storage (original function)
const generateQualities = (inputPath) => {
  const dir = path.dirname(inputPath);
  const name = path.parse(inputPath).name;

  return Promise.all(
    QUALITIES.map((q) => {
      const outputPath = `${dir}/${name}_${q.label}.mp4`;

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .size(q.size)
          .output(outputPath)
          .on("end", () => resolve({ quality: q.label, path: outputPath }))
          .on("error", reject)
          .run();
      });
    })
  );
};

// Generate qualities for S3 storage - downloads from S3 URL, transcodes, uploads back to S3
// Naming: video_{originalTimestamp}_{newTimestamp}_{quality}.mp4
const generateQualitiesS3 = async (s3VideoUrl, folderPath = "reelboost/reels") => {
  const tempDir = "./uploads/temp";

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Extract original timestamp from URL (e.g., video_1769081603587.mp4 -> 1769081603587)
  const originalFileName = path.basename(s3VideoUrl).split("?")[0];
  const originalTimestampMatch = originalFileName.match(/video_(\d+)/);
  const originalTimestamp = originalTimestampMatch ? originalTimestampMatch[1] : Date.now();

  const tempInputPath = `${tempDir}/${originalFileName}`;

  console.log("Downloading video from:", s3VideoUrl);
  console.log("Temp input path:", tempInputPath);

  // Download original video from S3 URL
  await downloadFromUrl(s3VideoUrl, tempInputPath);

  console.log("Download complete. File size:", fs.statSync(tempInputPath).size);

  // Transcode to different qualities
  const results = await Promise.all(
    QUALITIES.map((q) => {
      const newTimestamp = Date.now();
      // Naming: video_{originalTimestamp}_{newTimestamp}_{quality}.mp4
      const outputFileName = `video_${originalTimestamp}_${newTimestamp}_${q.label}.mp4`;
      const tempOutputPath = `${tempDir}/${outputFileName}`;

      return new Promise((resolve, reject) => {
        // ffmpeg(tempInputPath)
        //   .size(q.size)
        //   .output(tempOutputPath)
        //   .on("end", async () => {

              ffmpeg(tempInputPath)
          .videoFilters(`scale=${q.width}:-2`)
          .output(tempOutputPath)
          .on("end", async () => {
            try {
              // Upload transcoded file to S3
              const s3Url = await uploadLocalFileToS3(
                tempOutputPath,
                folderPath,
                outputFileName
              );
              resolve({ quality: q.label, path: s3Url });
            } catch (err) {
              reject(err);
            }
          })
          .on("error", reject)
          .run();
      });
    })
  );

  // Clean up original temp file
  if (fs.existsSync(tempInputPath)) {
    fs.unlinkSync(tempInputPath);
  }

  return results;
};

module.exports = { generateQualities, generateQualitiesS3 };
