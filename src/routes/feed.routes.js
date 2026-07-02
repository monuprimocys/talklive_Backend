const express = require('express');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const { moderationMiddleware } = require('../middleware/moderationMiddleware');
const feed_controller = require('../controller/feed_controller/feed.controller');

const router = express.Router();

/**
 * @route   POST /api/feed/create
 * @desc    Create a new feed post
 * @access  Private
 * @body    {
 *   "feed_type": "text|text_image|text_video|image_only|video_only",
 *   "content": "Post content text",
 *   "location": "Location string",
 *   "allow_comments": true|false,
 *   "mentioned_users": [user_id1, user_id2]
 * }
 * @files   For S3 mode: Send file_media_1 (image/video URL) in body
 *          For Local mode: Send files via multipart/form-data
 */
router.post('/create', authMiddleware, upload.fields([{ name: 'files', maxCount: 10 }]), moderationMiddleware, feed_controller.createFeedPost);

/**
 * @route   POST /api/feed/get-presigned-url
 * @desc    Get presigned URL for direct S3 upload (faster - bypasses backend)
 * @access  Private
 * @body    {
 *   "file_type": "image|video|doc|gif|thumb",
 *   "mime_type": "image/jpeg|video/mp4|etc"
 * }
 */
router.post('/get-presigned-url', authMiddleware, feed_controller.getPresignedUrl);

/**
 * @route   POST /api/feed/upload-media-in-s3
 * @desc    Upload media to S3 via backend (alternative to presigned URL)
 * @access  Private
 * @files   Single file: 'file'
 */
router.post('/upload-media-in-s3', authMiddleware, upload.single('file'), moderationMiddleware, feed_controller.uploadMediaS3);

/**
 * @route   POST /api/feed/get-feed
 * @desc    Get feed posts with filters
 * @access  Private
 * @body    {
 *   "page": 1,
 *   "pageSize": 10,
 *   "feed_type": "text|text_image|text_video|image_only|video_only|all",
 *   "location": "Location filter",
 *   "hashtag": "hashtag to search",
 *   "user_name": "username to filter",
 *   "sort_by": "createdAt",
 *   "sort_order": "DESC|ASC",
 *   "exclude_user_ids": [user_id1, user_id2]
 * }
 */
router.post('/get-feed', authMiddleware, feed_controller.getFeedPosts);

router.post('/search-feed', authMiddleware, feed_controller.searchFeeds);
router.post('/search-feed-by-location', authMiddleware, feed_controller.searchFeedsByLocation);
/**
 * @route   GET /api/feed/get-feed/:feed_id
 * @desc    Get a single feed post with all details
 * @access  Private
 */
router.get('/get-feed/:feed_id', authMiddleware, feed_controller.getFeedPostDetail);

/**
 * @route   PUT /api/feed/edit-feed/:feed_id
 * @desc    Edit a feed post (only by owner)
 * @access  Private
 * @body    {
 *   "content": "Updated content",
 *   "location": "Updated location",
 *   "allow_comments": true|false
 * }
 */
router.put('/edit-feed/:feed_id', authMiddleware, feed_controller.editFeedPost);

/**
 * @route   DELETE /api/feed/delete-feed/:feed_id
 * @desc    Delete a feed post (soft delete)
 * @access  Private
 */
router.delete('/delete-feed/:feed_id', authMiddleware, feed_controller.deleteFeedPost);

/**
 * @route   POST /api/feed/add-media/:feed_id
 * @desc    Upload media (image/video) to a feed post
 * @access  Private
 * @files   Single file: 'file'
 */
router.post('/add-media/:feed_id', authMiddleware, upload.single('file'), moderationMiddleware, feed_controller.uploadFeedMedia);

/**
 * @route   POST /api/feed/like-feed
 * @desc    Like a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id
 * }
 */
router.post('/like-feed', authMiddleware, feed_controller.likeFeedPost);

/**
 * @route   POST /api/feed/unlike-feed
 * @desc    Unlike a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id
 * }
 */
router.post('/unlike-feed', authMiddleware, feed_controller.unlikeFeedPost);

/**
 * @route   POST /api/feed/get-likes/:feed_id
 * @desc    Get all users who liked a feed post
 * @access  Private
 * @body    {
 *   "page": 1,
 *   "pageSize": 20
 * }
 */
router.post('/get-likes/:feed_id', authMiddleware, feed_controller.getFeedPostLikes);

/**
 * @route   POST /api/feed/add-comment
 * @desc    Add a comment to a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id,
 *   "comment_text": "Comment text",
 *   "mentioned_users": [user_id1, user_id2]
 * }
 */
router.post('/add-comment', authMiddleware, feed_controller.addCommentToFeed);

/**
 * @route   POST /api/feed/get-comments/:feed_id
 * @desc    Get all comments for a feed post
 * @access  Private
 * @body    {
 *   "page": 1,
 *   "pageSize": 20
 * }
 */
router.post('/get-comments/:feed_id', authMiddleware, feed_controller.getFeedPostComments);

/**
 * @route   DELETE /api/feed/delete-comment/:comment_id
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/delete-comment/:comment_id', authMiddleware, feed_controller.deleteCommentFromFeed);

/**
 * Reply to a comment
 * POST /api/feed/add-reply
 */
router.post('/add-reply', authMiddleware, feed_controller.addReplyToComment);

/**
 * Get replies for a comment
 * GET /api/feed/get-replies/:comment_id
 * @param  comment_id  - ID of the parent comment whose replies to fetch
 * @body   { page, pageSize } - Pagination params (optional)
 */
router.post('/get-replies', authMiddleware, feed_controller.getCommentReplies);

/**
 * Like / Unlike comment (reply or top-level)
 */
router.post('/like-comment', authMiddleware, feed_controller.likeComment);
router.post('/unlike-comment', authMiddleware, feed_controller.unlikeComment);

/**
 * @route   POST /api/feed/save-feed
 * @desc    Save a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id
 * }
 */
router.post('/save-feed', authMiddleware, feed_controller.saveFeedPost);

/**
 * @route   POST /api/feed/unsave-feed
 * @desc    Unsave a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id
 * }
 */
router.post('/unsave-feed', authMiddleware, feed_controller.unsaveFeedPost);

/**
 * @route   POST /api/feed/get-saved-feeds
 * @desc    Get all saved feeds by current user
 * @access  Private
 * @body    {
 *   "page": 1,
 *   "pageSize": 10
 * }
 */
router.post('/get-saved-feeds', authMiddleware, feed_controller.getUserSavedFeedsController);

/**
 * @route   POST /api/feed/report-feed
 * @desc    Report a feed post
 * @access  Private
 * @body    {
 *   "feed_id": feed_id,
 *   "report_type": "inappropriate|spam|harassment|other",
 *   "report_description": "Detailed description"
 * }
 */
/**
 * @route   POST /api/feed/get-my-feeds
 * @desc    Get all feeds created by the authenticated user
 * @access  Private
 * @body    { "page": 1, "pageSize": 10 }
 */
router.post('/get-my-feeds', authMiddleware, feed_controller.getMyFeeds);

router.post('/report-feed', authMiddleware, feed_controller.reportFeedPost);
router.post("/update-status", optionalAuthMiddleware, feed_controller.updateFeedStatus);

 router.post("/admin/feed", optionalAuthMiddleware, feed_controller.getFeedPostsAdmin);







module.exports = router;
