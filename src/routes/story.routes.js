const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");
const { moderationMiddleware } = require("../middleware/moderationMiddleware");

const story_controller = require("../controller/story_controller/story.controller");

/**
 * @route POST /api/story/create
 * @desc Create story
 * @access Private
 *
 * S3 Mode:
 * {
 *   "expires_in_hours": 24,
 *   "allow_replies": true,
 *   "file_media_1": "https://cdn....jpg",
 *   "media_type_1": "image"
 * }
 *
 * Local Mode:
 * multipart/form-data
 * files[]
 */
router.post(
  "/create",
  authMiddleware,
  upload.fields([{ name: "files", maxCount: 10 }]),
  moderationMiddleware,
  story_controller.createStoryHandler,
);

/**
 * @route POST /api/story/get-presigned-url
 * @desc Generate Presigned URL
 * @access Private
 *
 * {
 *   "file_type":"image|video",
 *   "mime_type":"image/jpeg"
 * }
 */
router.post(
  "/get-presigned-url",
  authMiddleware,
  story_controller.getPresignedUrl,
);

/**
 * @route POST /api/story/upload-media-in-s3
 * @desc Upload media through backend
 * @access Private
 */
router.post(
  "/upload-media-in-s3",
  authMiddleware,
  upload.single("file"),
  moderationMiddleware,
  story_controller.uploadMediaS3,
);

/**
 * @route POST /api/story/list
 * @desc Get stories
 * @access Private
 *
 * {
 *   "user_ids":[1,2,3]
 * }
 */
router.post("/list", authMiddleware, story_controller.listStoriesHandler);

/**
 * @route POST /api/story/view
 * @desc Mark story viewed
 * @access Private
 *
 * {
 *   "story_id":1
 * }
 */
router.post("/view", authMiddleware, story_controller.markViewedHandler);

/**
 * @route POST /api/story/user-detail
 * @desc Get user stories
 * @access Private
 *
 * {
 *   "user_id":1
 * }
 */
router.post(
  "/user-detail",
  authMiddleware,
  story_controller.getUserStoryDetailHandler,
);

router.delete(
  "/delete/:story_id",
  authMiddleware,
  story_controller.deleteStoryHandler
);

module.exports = router;
