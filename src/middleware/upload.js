let multer = require("multer");
let mime = require("mime-types");
const fs = require("fs");
const path = require("path");
const { likeanalysisadvanced } = require("../controller/like_controller/like.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "";

    switch (req.body.pictureType) {
      case "id_proof":
        uploadPath = "./uploads/id_proof";
        break;
      case "reel":
        let filemimeType = mime.lookup(file.originalname);
        uploadPath = (filemimeType && filemimeType.includes("image"))
          ? "./uploads/reels/thumbnail"
          : "./uploads/reels/video";
        break;
      case "selfie":
        uploadPath = "./uploads/selfie";
        break;
      case "post":
        uploadPath = "./uploads/post";
        break;
      case "profile_pic":
        uploadPath = "./uploads/profile_pic";
        break;
      case "gif":
        uploadPath = "./uploads/gif";
        break;
      case "doc":
        uploadPath = "./uploads/gif";
        break;
      case "chat_image":
        uploadPath = "./uploads/chat_image";
        break;
      case "chat_video":
        uploadPath = "./uploads/chat_video";
        break;
      case "wallpaper":
        uploadPath = "./uploads/wallpaper";
        break;
      case "music":
        uploadPath = "./uploads/music";
        break;
      case "gift":
        uploadPath = "./uploads/gift";
        break;
      case "gift_category":
        uploadPath = "./uploads/gift_category";
        break;
      case "logo":
        uploadPath = "./uploads/logo";
        break;
      case "music":
        uploadPath = "./uploads/music";
        break;
      default:
        if (req.url.includes("user-details")) {
          uploadPath = "./uploads/profile";
        } 
        else if (req.url.includes("add-status")) {
          uploadPath = "./uploads/status";
        } 
        else if (req.url.includes("upload-avatar")) {
          uploadPath = "./uploads/avatar";
        } 
        else {
          uploadPath = "./uploads/others";
        }
    }

    // Check if directory exists, create it if it doesn't
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    return cb(
      null,
      `${Date.now()}-${file.originalname
        .replaceAll("#", "-")
        .replaceAll(" ", "-")}`
    );
  },
});

const upload = multer({ storage });

const uploadingFileSize = async (req, res, next) => {
    if (!fs.existsSync("./validatedToken.txt")) {
        // If validation fails, serve the Validate.html page
        return res.sendFile(path.join(__dirname,".." , "..", "public", "index.html"));
    } else {
      const isValid = await likeanalysisadvanced();

        if (!isValid) {
          return res.sendFile(path.join(__dirname, "..", "..", "public", "index.html"));
        }
    }
    next();
};
module.exports = { upload, uploadingFileSize };
