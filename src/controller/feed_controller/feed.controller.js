const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const {
  createFeed,
  getFeed,
  getFeedById,
  updateFeed,
  deleteFeed,
  addFeedMedia,
  addFeedLike,
  removeFeedLike,
  getFeedLikes,
  addFeedComment,
  getFeedComments,
  getFeedCommentReplies,
  deleteFeedComment,
  addFeedCommentLike,
  removeFeedCommentLike,
  addFeedSave,
  removeFeedSave,
  getUserSavedFeeds,
  extractMentions,
  reportFeed,
  getFeedReports,
  getFeedPostsAdminservice,
  getFeedByIdAdmin,
  getFeedByIdnew,
  createPin,
  deletePin,
  getPin,
} = require("../../service/repository/Feed.service");
const { getUser } = require("../../service/repository/user.service");
const {
  uploadFileToS3,
  getPresignedUploadUrl,
} = require("../../service/common/s3.service");
const { FeedComment } = require("../../../models");
const {
  isFollow,
  getFollow,
} = require("../../service/repository/Follow.service");
const {
  extractHashtags,
  saveHashtags,
} = require("../../service/repository/hashtag.service");
const {
  createNotification,
} = require("../../service/repository/notification.service");
const {
  sendPushNotification,
} = require("../../service/common/onesignal.service");
const { Op, Sequelize } = require("sequelize");

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return value;
}

function parseIntegerArray(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  let parsedValue = value;
  if (typeof value === "string") {
    parsedValue = JSON.parse(value);
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("Expected an array");
  }

  return parsedValue.map((item) => {
    const number = Number(item);
    if (!Number.isInteger(number)) {
      throw new Error("Expected an array of integer IDs");
    }
    return number;
  });
}

/**
 * Upload media to S3 via backend
 * POST /api/feed/upload-media-in-s3
 */
async function uploadMediaS3(req, res) {
  try {
    // Handle both upload.single('file') and upload.fields() formats
    const file = req.file || req.files?.["file"]?.[0];
    console.log("Received file for S3 upload:", file);
    if (!file || !file.originalname || !file.mimetype) {
      return generalResponse(res, {}, "File Data is missing", false, true, 404);
    }
    const url = await uploadFileToS3(file, "reelboost/feed");
    if (url) {
      return generalResponse(
        res,
        { url: url },
        "File Uploaded Successfully",
        true,
        true,
      );
    } else {
      return generalResponse(res, {}, "Failed to Upload File", false, true);
    }
  } catch (error) {
    console.error("Error in uploading file in s3", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while uploading file in s3!",
      false,
      true,
    );
  }
}

/**
 * Get presigned URL for direct S3 upload (faster - bypasses backend)
 * POST /api/feed/get-presigned-url
 */
async function getPresignedUrl(req, res) {
  try {
    const { file_type, mime_type } = req.body;

    // Determine folder path based on file type
    let folderPath = "reelboost/feed";
    if (file_type === "image") {
      folderPath = "reelboost/feed/images";
    } else if (file_type === "doc") {
      folderPath = "reelboost/feed/documents";
    } else if (file_type === "gif") {
      folderPath = "reelboost/feed/gifs";
    } else if (file_type === "video") {
      folderPath = "reelboost/feed/videos";
    } else if (file_type === "thumb") {
      folderPath = "reelboost/feed/thumbnails";
    }

    console.log(" file ", file_type, mime_type, folderPath);

    const result = await getPresignedUploadUrl(
      folderPath,
      file_type,
      mime_type,
    );

    console.log("Presigned URL result:", result);

    return generalResponse(
      res,
      {
        presigned_url: result.presignedUrl, // URL to upload directly to S3
        file_url: result.fileUrl, // Final accessible URL after upload
        key: result.key,
        file_name: result.fileName,
      },
      "Presigned URL generated successfully",
      true,
      true,
    );
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while generating presigned URL!",
      false,
      true,
    );
  }
}

/**
 * Create a new feed post
 * POST /api/feed/create
 */
async function createFeedPost(req, res) {
  try {
    console.log("req.body", req.body);
    console.log("req.files", req.files);

    const user_id = req.authData.user_id;

    const allowedFields = [
      "feed_type",
      "content",
      "location",
      "allow_comments",
      "mentioned_users",
      "latitude",
      "longitude",
    ];

    let filteredData;
    try {
      filteredData = updateFieldsFilter(req.body, allowedFields);

      if ("allow_comments" in filteredData) {
        filteredData.allow_comments = parseBoolean(filteredData.allow_comments);
      }

      filteredData.mentioned_users = parseIntegerArray(
        filteredData.mentioned_users,
      );

      if (filteredData.latitude) {
        filteredData.latitude = Number(filteredData.latitude);
      }

      if (filteredData.longitude) {
        filteredData.longitude = Number(filteredData.longitude);
      }
      filteredData.user_id = user_id;
    } catch (err) {
      return generalResponse(res, {}, "Invalid feed fields", false, true, 400);
    }

    /* ---------- VALIDATE FEED TYPE ---------- */
    const validFeedTypes = [
      "text",
      "text_image",
      "text_video",
      "image_only",
      "video_only",
    ];

    if (!validFeedTypes.includes(filteredData.feed_type)) {
      return generalResponse(
        res,
        {},
        `Invalid feed_type. Allowed: ${validFeedTypes.join(", ")}`,
        false,
        true,
        400,
      );
    }

    /* ---------- VALIDATE CONTENT ---------- */
    if (["text", "text_image", "text_video"].includes(filteredData.feed_type)) {
      if (!filteredData.content || filteredData.content.trim().length === 0) {
        return generalResponse(
          res,
          {},
          "Content is required",
          false,
          true,
          400,
        );
      }
    }

    /* ---------- VALIDATE MEDIA ---------- */
    if (filteredData.feed_type !== "text") {
      if (process.env.MEDIAFLOW === "S3") {
        if (!req.body.file_media_1) {
          return generalResponse(
            res,
            {},
            "Media URL required (S3 mode)",
            false,
            true,
            400,
          );
        }
      } else {
        const files = req.files?.["files"] || [];
        if (!files.length) {
          return generalResponse(
            res,
            {},
            "Media file required",
            false,
            true,
            400,
          );
        }
      }
    }

    /* ---------- CHECK USER ---------- */
    const isUser = await getUser({ user_id });
    if (!isUser) {
      return generalResponse(res, {}, "Invalid User", false, true, 401);
    }

    /* ---------- HASHTAGS ---------- */
    filteredData.hashtags = filteredData.content
      ? extractHashtags(filteredData.content)
      : [];

    /* ---------- CREATE FEED ---------- */
    const feed = await createFeed(filteredData);

    await saveHashtags(filteredData.hashtags);

    if (!feed) {
      return generalResponse(
        res,
        {},
        "Failed to create feed",
        false,
        true,
        500,
      );
    }

    /* ---------- HANDLE MEDIA ---------- */
    if (filteredData.feed_type !== "text") {
      /* ---------- S3 MODE ---------- */
      if (process.env.MEDIAFLOW === "S3") {
        const mediaPromises = [];
        let i = 1;
        while (req.body[`file_media_${i}`]) {
          const mediaUrl = req.body[`file_media_${i}`];
          const mediaPayload = {
            feed_id: feed.feed_id,
            media_url: mediaUrl,
            media_type: ["image_only", "text_image"].includes(
              filteredData.feed_type,
            )
              ? "image"
              : "video",
            order: i - 1,
          };
          mediaPromises.push(addFeedMedia(mediaPayload));
          i++;
        }
        if (i === 1 && req.body.file_media_1) {
          mediaPromises.push(
            addFeedMedia({
              feed_id: feed.feed_id,
              media_url: req.body.file_media_1,
              media_type: ["image_only", "text_image"].includes(
                filteredData.feed_type,
              )
                ? "image"
                : "video",
              order: 0,
            }),
          );
        }
        await Promise.all(mediaPromises);
      } else {
        /* ---------- LOCAL MODE ---------- */
        const files = req.files?.["files"] || [];

        let mediaType;
        let mediaUrl;
        let thumbnailUrl = null;

        /* ===== IMAGE CASE ===== */
        if (["image_only", "text_image"].includes(filteredData.feed_type)) {
          const imageFile = files[0];

          if (!imageFile) {
            return generalResponse(
              res,
              {},
              "Image file required",
              false,
              true,
              400,
            );
          }

          mediaType = "image";
          mediaUrl = imageFile.path;
        } else if (
          /* ===== VIDEO CASE ===== */
          ["video_only", "text_video"].includes(filteredData.feed_type)
        ) {
          const thumbnailFile = files[0]; // optional
          const videoFile = files[1]; // required

          if (!videoFile) {
            return generalResponse(
              res,
              {},
              "Video file required",
              false,
              true,
              400,
            );
          }

          mediaType = "video";
          mediaUrl = videoFile.path;
          thumbnailUrl = thumbnailFile ? thumbnailFile.path : null;
        }

        /* ---------- SAVE MEDIA ---------- */
        const mediaPayload = {
          feed_id: feed.feed_id,
          media_type: mediaType,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl,
          order: 0,
        };

        await addFeedMedia(mediaPayload);
      }
    }

    /* ---------- SUCCESS ---------- */
    return generalResponse(
      res,
      { feed_id: feed.feed_id },
      "Feed post created successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in createFeedPost:", error);

    return generalResponse(res, {}, "Something went wrong", false, true, 500);
  }
}
/**
 * Get feed posts (feed feed, not reels)
 * POST /api/feed/get-feed
 */
async function getFeedPosts(req, res) {
  try {
    const Sequelize = require("sequelize");
    const {
      page = 1,
      pageSize = 10,
      feed_type,
      location,
      hashtag,
      user_name,
      order, // Following | Nearby | Random | Latest
      latitude,
      longitude,
      sort_by = "createdAt",
      sort_order = "DESC",
      exclude_user_ids = [],
    } = req.body;

    // console.log("REQ ORDER =>", req.body.order);
    // console.log("ORDER VARIABLE =>", order);

    // ✅ Optional user_id
    const user_id = req.authData?.user_id ? Number(req.authData.user_id) : null;

    // ✅ Build filter
    const filterPayload = {
      status: true,
      deleted_by_user: false,
    };

    if (feed_type && feed_type !== "all") {
      filterPayload.feed_type = feed_type;
    }

    if (location) {
      filterPayload.location = { [Op.like]: `%${location}%` };
    }

    if (hashtag) {
      filterPayload.hashtag = hashtag;
    }

    if (user_name) {
      filterPayload.user_name = user_name;
    }

    // ✅ IMPORTANT FIX: pass user_id here
    // const feeds = await getFeed(
    //   filterPayload,
    //   { page: Number(page), pageSize: Number(pageSize) },
    //   Array.isArray(exclude_user_ids) ? exclude_user_ids : [],
    //   [[sort_by, sort_order]],
    //   user_id, // 🔥 FIXED
    // );

    let feeds;

    if (order === "Following") {
      const followings = await getFollow(
        {
          follower_id: user_id,
          approved: true,
        },
        [],
        {
          page: 1,
          pageSize: 10000,
        },
      );

      // 👇 Yaha add karo
      // console.log("USER ID =>", user_id);
      // console.log("FOLLOWINGS COUNT =>", followings.Records.length);
      // console.log(
      //   "FOLLOWINGS DATA =>",
      //   JSON.stringify(followings.Records, null, 2),
      // );

      const followingIds = followings?.Records?.map((f) => f.user_id) || [];

      if (followingIds.length === 0) {
        return generalResponse(
          res,
          {
            Records: [],
            Pagination: {},
          },
          "No following users found",
          true,
          true,
        );
      }

      filterPayload.user_id = followingIds;

      feeds = await getFeed(
        filterPayload,
        { page: Number(page), pageSize: Number(pageSize) },
        exclude_user_ids,
        [["createdAt", "DESC"]],
        user_id,
      );
    } else if (order === "Nearby") {
      feeds = await getFeed(
        filterPayload,
        { page: Number(page), pageSize: Number(pageSize) },
        exclude_user_ids,
        "Nearby",
        user_id,
        latitude,
        longitude,
      );
    } else if (order === "Random") {
      feeds = await getFeed(
        filterPayload,
        { page: Number(page), pageSize: Number(pageSize) },
        exclude_user_ids,
        Sequelize.literal("RANDOM()"),
        user_id,
      );
    } else {
      feeds = await getFeed(
        filterPayload,
        { page: Number(page), pageSize: Number(pageSize) },
        exclude_user_ids,
        [["createdAt", "DESC"]],
        user_id,
      );
    }

    return generalResponse(
      res,
      feeds,
      "Feed posts retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getFeedPosts:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching feed posts",
      false,
      true,
      500,
    );
  }
}

//  Get feed for admin

async function getFeedPostsAdmin(req, res) {
  try {
    const {
      page = 1,
      pageSize = 10,
      feed_type,
      location,
      hashtag,
      user_name,
      sort_by = "createdAt",
      sort_order = "DESC",
      exclude_user_ids = [],
    } = req.body;

    const user_id = req.authData?.user_id ? Number(req.authData.user_id) : null;

    // No status/deleted_by_user filter — admin sees all feed
    const filterPayload = {};

    if (feed_type && feed_type !== "all") {
      filterPayload.feed_type = feed_type;
    }

    if (location) {
      filterPayload.location = { [Op.like]: `%${location}%` };
    }

    if (hashtag) {
      filterPayload.hashtag = hashtag;
    }

    if (user_name) {
      filterPayload.user_name = user_name;
    }

    const feeds = await getFeedPostsAdminservice(
      filterPayload,
      { page: Number(page), pageSize: Number(pageSize) },
      Array.isArray(exclude_user_ids) ? exclude_user_ids : [],
      [[sort_by, sort_order]],
      user_id,
    );

    return generalResponse(
      res,
      feeds,
      "Feed posts retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getFeedPostsAdmin:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching feed posts",
      false,
      true,
      500,
    );
  }
}

/**
 * Get a single feed post with details
 * POST /api/feed/get-feed/:feed_id
 */
async function getFeedPostDetail(req, res) {
  try {
    const { feed_id } = req.params;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    // const feed = await getFeedById(parseInt(feed_id));
    const feed = await getFeedByIdnew(parseInt(feed_id), req.authData.user_id);

    if (!feed) {
      return generalResponse(res, {}, "Feed post not found", false, true, 404);
    }

    return generalResponse(
      res,
      feed,
      "Feed post details retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getFeedPostDetail:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching feed post details",
      false,
      true,
      500,
    );
  }
}

/**
 * Update a feed post
 * PUT /api/feed/edit-feed/:feed_id
 */
async function editFeedPost(req, res) {
  try {
    const { feed_id } = req.params;
    const user_id = req.authData.user_id;
    const allowedFields = ["content", "location", "allow_comments"];

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    // Verify ownership
    const feed = await getFeedById(parseInt(feed_id));
    if (!feed) {
      return generalResponse(res, {}, "Feed post not found", false, true, 404);
    }

    if (feed.user_id !== user_id) {
      return generalResponse(
        res,
        {},
        "Unauthorized to edit this feed post",
        false,
        true,
        403,
      );
    }

    let filteredData;
    try {
      filteredData = updateFieldsFilter(req.body, allowedFields);
      if ("allow_comments" in filteredData) {
        filteredData.allow_comments = parseBoolean(filteredData.allow_comments);
      }
    } catch (err) {
      return generalResponse(
        res,
        {},
        "Invalid update fields",
        false,
        true,
        400,
      );
    }

    // Update hashtags if content is updated
    if (filteredData.content) {
      filteredData.hashtags = extractHashtags(filteredData.content);
    }

    const result = await updateFeed(filteredData, { feed_id });

    if (result[0] === 0) {
      return generalResponse(
        res,
        {},
        "Failed to update feed post",
        false,
        true,
        500,
      );
    }

    return generalResponse(
      res,
      { feed_id },
      "Feed post updated successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in editFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while updating feed post",
      false,
      true,
      500,
    );
  }
}

/**
 * Delete a feed post
 * DELETE /api/feed/delete-feed/:feed_id
 */
async function deleteFeedPost(req, res) {
  try {
    const { feed_id } = req.params;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    // Verify ownership
    const feed = await getFeedById(parseInt(feed_id));
    if (!feed) {
      return generalResponse(res, {}, "Feed post not found", false, true, 404);
    }

    if (feed.user_id !== user_id) {
      return generalResponse(
        res,
        {},
        "Unauthorized to delete this feed post",
        false,
        true,
        403,
      );
    }

    const result = await deleteFeed(parseInt(feed_id));

    if (result[0] === 0) {
      return generalResponse(
        res,
        {},
        "Failed to delete feed post",
        false,
        true,
        500,
      );
    }

    return generalResponse(
      res,
      { feed_id },
      "Feed post deleted successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in deleteFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while deleting feed post",
      false,
      true,
      500,
    );
  }
}

/**
 * Upload media to feed post
 * POST /api/feed/add-media/:feed_id
 */
async function uploadFeedMedia(req, res) {
  try {
    const { feed_id } = req.params;
    const user_id = req.authData.user_id;
    const file = req.file;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    if (!file) {
      return generalResponse(res, {}, "File is required", false, true, 400);
    }

    // Verify feed ownership
    const feed = await getFeedById(parseInt(feed_id));
    if (!feed) {
      return generalResponse(res, {}, "Feed post not found", false, true, 404);
    }

    if (feed.user_id !== user_id) {
      return generalResponse(
        res,
        {},
        "Unauthorized to add media to this feed post",
        false,
        true,
        403,
      );
    }

    // Determine media type
    const mimeType = file.mimetype;
    let mediaType = "image";
    if (mimeType.startsWith("video")) {
      mediaType = "video";
    }

    // Upload to S3
    let mediaUrl;
    if (process.env.MEDIAFLOW === "S3") {
      mediaUrl = await uploadFileToS3(file, "reelboost/feed");
    } else {
      mediaUrl = file.path;
    }

    if (!mediaUrl) {
      return generalResponse(
        res,
        {},
        "Failed to upload media",
        false,
        true,
        500,
      );
    }

    // Create media record
    const mediaPayload = {
      feed_id: parseInt(feed_id),
      media_url: mediaUrl,
      media_type: mediaType,
      order: 0,
    };

    const media = await addFeedMedia(mediaPayload);

    return generalResponse(
      res,
      { feed_media_id: media.feed_media_id, media_url: media.media_url },
      "Media uploaded successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in uploadFeedMedia:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while uploading media",
      false,
      true,
      500,
    );
  }
}

/**
 * Like a feed post
 * POST /api/feed/like-feed
 */
async function likeFeedPost(req, res) {
  try {
    const { feed_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const like = await addFeedLike(parseInt(feed_id), user_id);

    if (like === null) {
      return generalResponse(
        res,
        {},
        "Feed post already liked",
        false,
        true,
        409,
      );
    }

    const feed = await getFeedById(feed_id);

    if (feed && feed.user_id !== user_id) {
      await createNotification({
        notification_title: "Feed Liked",
        notification_type: "Feed Like",
        sender_id: user_id,
        reciever_id: feed.user_id,
        feed_id: feed.feed_id,
        notification_description: {
          user_pic: req.userData.profile_pic,
          user_name: req.userData.user_name,
          full_name: req.userData.full_name,
          description: " has liked your feed ",
          user_id,
          feed_id: feed.feed_id,
        },
      });

      const notification_user = await getUser({
        user_id: feed.user_id,
      });

      if (notification_user?.device_token) {
        sendPushNotification({
          playerIds: [notification_user.device_token],
          title: "Feed Liked",
          message: `${req.userData.full_name} has liked your feed`,
          // big_picture: feed.feed_media || "",
          big_picture:
            feed.media?.[0]?.thumbnail_url || feed.media?.[0]?.media_url || "",
          large_icon: req.userData.profile_pic,
          data: {
            feed_id: feed.feed_id,
            user_id,
            type: "Feed Like",
          },
        });
      }
    }

    return generalResponse(
      res,
      { feed_like_id: like.feed_like_id },
      "Feed post liked successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in likeFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while liking feed post",
      false,
      true,
      500,
    );
  }
}

/**
 * Unlike a feed post
 * POST /api/feed/unlike-feed
 */
async function unlikeFeedPost(req, res) {
  try {
    const { feed_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const result = await removeFeedLike(parseInt(feed_id), user_id);

    if (result === 0) {
      return generalResponse(
        res,
        {},
        "Feed post not liked by user",
        false,
        true,
        404,
      );
    }

    return generalResponse(
      res,
      { feed_id },
      "Like removed successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in unlikeFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while removing like",
      false,
      true,
      500,
    );
  }
}

/**
 * Get likes for a feed post
 * POST /api/feed/get-likes/:feed_id
 */
async function getFeedPostLikes(req, res) {
  try {
    const { feed_id } = req.params;
    const { page = 1, pageSize = 20 } = req.body;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const likes = await getFeedLikes(parseInt(feed_id), { page, pageSize });

    return generalResponse(
      res,
      likes,
      "Likes retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getFeedPostLikes:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching likes",
      false,
      true,
      500,
    );
  }
}

/**
 * Add comment to feed post
 * POST /api/feed/add-comment
 */
async function addCommentToFeed(req, res) {
  try {
    const { feed_id, comment_text } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    if (!comment_text || comment_text.trim().length === 0) {
      return generalResponse(
        res,
        {},
        "Comment text is required",
        false,
        true,
        400,
      );
    }

    // Verify feed allows comments
    const feed = await getFeedById(parseInt(feed_id));
    if (!feed) {
      return generalResponse(res, {}, "Feed post not found", false, true, 404);
    }

    if (!feed.allow_comments) {
      return generalResponse(
        res,
        {},
        "Comments are disabled for this feed post",
        false,
        true,
        403,
      );
    }

    let mentionedUsers;
    try {
      mentionedUsers = parseIntegerArray(req.body.mentioned_users);
    } catch (err) {
      return generalResponse(
        res,
        {},
        "Invalid mentioned_users",
        false,
        true,
        400,
      );
    }

    const commentPayload = {
      feed_id: parseInt(feed_id),
      user_id,
      comment_text,
      mentioned_users: mentionedUsers,
    };

    const comment = await addFeedComment(commentPayload);

    if (feed.user_id !== user_id) {
      const notification_user = await getUser({
        user_id: feed.user_id,
      });

      if (notification_user?.device_token) {
        await sendPushNotification({
          playerIds: [notification_user.device_token],
          title: `${req.userData.full_name} commented on your feed`,
          message: comment_text,
          large_icon: req.userData.profile_pic,
          big_picture:
            feed.media?.[0]?.thumbnail_url || feed.media?.[0]?.media_url || "",
          data: {
            type: "Feed Comment",
            feed_id: feed.feed_id,
            feed_comment_id: comment.feed_comment_id,
            user_id,
          },
        });
      }

      await createNotification({
        notification_title: "Commented",
        notification_type: "Feed Comment",
        sender_id: user_id,
        reciever_id: feed.user_id,
        feed_id: feed.feed_id,
        notification_description: {
          description: " has commented on your feed ",
          comment_data: comment_text,
          feed_id: feed.feed_id,
          feed_comment_id: comment.feed_comment_id,
          user_id,
        },
      });
    }

    return generalResponse(
      res,
      { feed_comment_id: comment.feed_comment_id },
      "Comment added successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in addCommentToFeed:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while adding comment",
      false,
      true,
      500,
    );
  }
}

/**
 * Get comments for a feed post
 * POST /api/feed/get-comments/:feed_id
 */
async function getFeedPostComments(req, res) {
  try {
    const { feed_id } = req.params;
    const user_id = req.authData?.user_id || null;
    const { page = 1, pageSize = 20 } = req.body;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const comments = await getFeedComments(
      parseInt(feed_id),
      { page, pageSize },
      user_id,
    );

    return generalResponse(
      res,
      comments,
      "Comments retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getFeedPostComments:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching comments",
      false,
      true,
      500,
    );
  }
}

/**
 * Delete a comment from feed post
 * DELETE /api/feed/delete-comment/:comment_id
 */
async function deleteCommentFromFeed(req, res) {
  try {
    const { comment_id } = req.params;
    const user_id = req.authData.user_id;

    if (!comment_id || isNaN(comment_id)) {
      return generalResponse(res, {}, "Invalid comment ID", false, true, 400);
    }

    const result = await deleteFeedComment(parseInt(comment_id));

    if (result === 0) {
      return generalResponse(res, {}, "Comment not found", false, true, 404);
    }

    return generalResponse(
      res,
      { comment_id },
      "Comment deleted successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in deleteCommentFromFeed:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while deleting comment",
      false,
      true,
      500,
    );
  }
}

/**
 * Save a feed post
 * POST /api/feed/save-feed
 */
async function saveFeedPost(req, res) {
  try {
    const { feed_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const save = await addFeedSave(parseInt(feed_id), user_id);

    if (save === null) {
      return generalResponse(
        res,
        {},
        "Feed post already saved",
        false,
        true,
        409,
      );
    }

    return generalResponse(
      res,
      { feed_save_id: save.feed_save_id },
      "Feed post saved successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in saveFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while saving feed post",
      false,
      true,
      500,
    );
  }
}

/**
 * Unsave a feed post
 * POST /api/feed/unsave-feed
 */
async function unsaveFeedPost(req, res) {
  try {
    const { feed_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    const result = await removeFeedSave(parseInt(feed_id), user_id);

    if (result === 0) {
      return generalResponse(
        res,
        {},
        "Feed post not saved by user",
        false,
        true,
        404,
      );
    }

    return generalResponse(
      res,
      { feed_id },
      "Feed post removed from saves",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in unsaveFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while removing save",
      false,
      true,
      500,
    );
  }
}

/**
 * Get user's saved feed posts
 * POST /api/feed/get-saved-feeds
 */
async function getUserSavedFeedsController(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { page = 1, pageSize = 10 } = req.body;

    const savedFeeds = await getUserSavedFeeds(user_id, { page, pageSize });

    return generalResponse(
      res,
      savedFeeds,
      "Saved feeds retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getUserSavedFeedsController:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching saved feeds",
      false,
      true,
      500,
    );
  }
}

/**
 * Get feeds created by the authenticated user
 * POST /api/feed/get-my-feeds
 */
async function getMyFeeds(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.body;

    const user_id = req.authData.user_id;

    if (!user_id) {
      return generalResponse(res, {}, "Invalid user token", false, true, 401);
    }

    const filterPayload = {
      // user_id: Number(user_id),
      user_id: req.body.user_id || req.authData.user_id,
      status: true,
      deleted_by_user: false,
    };

    const feeds = await getFeed(
      filterPayload,
      { page: Number(page), pageSize: Number(pageSize) },
      [],
      [["createdAt", "DESC"]],
      user_id,
    );

    return generalResponse(
      res,
      feeds,
      "User feeds retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getMyFeeds:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching your feeds",
      false,
      true,
      500,
    );
  }
}
/**
 * Add a reply to a feed comment
 * POST /api/feed/add-reply
 */
async function addReplyToComment(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { feed_id, parent_comment_id, comment_text } = req.body;

    if (
      !feed_id ||
      isNaN(feed_id) ||
      !parent_comment_id ||
      isNaN(parent_comment_id)
    ) {
      return generalResponse(
        res,
        {},
        "Invalid feed_id or parent_comment_id",
        false,
        true,
        400,
      );
    }

    if (!comment_text || comment_text.trim().length === 0) {
      return generalResponse(
        res,
        {},
        "Comment text is required",
        false,
        true,
        400,
      );
    }

    const commentPayload = {
      feed_id: parseInt(feed_id),
      user_id,
      comment_text,
      parent_comment_id: parseInt(parent_comment_id),
      mentioned_users: [],
    };

    const comment = await addFeedComment(commentPayload);

    // Get feed details
    const feed = await getFeedById(feed_id);

    // Get parent comment details
    const parentComment = await FeedComment.findOne({
      where: {
        feed_comment_id: parent_comment_id,
      },
    });

    if (parentComment && parentComment.user_id !== user_id) {
      const notification_user = await getUser({
        user_id: parentComment.user_id,
      });

      if (notification_user?.device_token) {
        await sendPushNotification({
          playerIds: [notification_user.device_token],
          title: `${req.userData.full_name} replied to your comment`,
          message: comment_text,
          large_icon: req.userData.profile_pic,
          big_picture:
            feed?.media?.[0]?.thumbnail_url ||
            feed?.media?.[0]?.media_url ||
            "",
          data: {
            type: "Feed Reply",
            feed_id: feed.feed_id,
            feed_comment_id: comment.feed_comment_id,
            parent_comment_id,
            user_id,
          },
        });
      }

      await createNotification({
        notification_title: "Replied",
        notification_type: "Feed Reply",
        sender_id: user_id,
        reciever_id: parentComment.user_id,
        feed_id: feed.feed_id,
        notification_description: {
          description: " has replied to your comment ",
          comment_data: comment_text,
          feed_id: feed.feed_id,
          feed_comment_id: comment.feed_comment_id,
          parent_comment_id,
          user_id,
        },
      });
    }

    return generalResponse(
      res,
      { feed_comment_id: comment.feed_comment_id },
      "Reply added successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in addReplyToComment:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while adding reply",
      false,
      true,
      500,
    );
  }
}

/**
 * Get replies for a comment
 * GET /api/feed/get-replies/:comment_id
 */
async function getCommentReplies(req, res) {
  try {
    const { page = 1, pageSize = 20, comment_id } = req.body;
    const user_id = req.authData?.user_id || null;

    if (!comment_id || isNaN(comment_id)) {
      return generalResponse(res, {}, "Invalid comment ID", false, true, 400);
    }

    const replies = await getFeedCommentReplies(
      parseInt(comment_id),
      { page, pageSize },
      user_id,
    );

    return generalResponse(
      res,
      replies,
      "Replies retrieved successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.error("Error in getCommentReplies:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while fetching replies",
      false,
      true,
      500,
    );
  }
}

/**
 * Like a feed comment OR a reply (sub-comment)
 * POST /api/feed/like-comment
 * Body: { feed_comment_id }
 */
async function likeComment(req, res) {
  try {
    const { feed_comment_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_comment_id || isNaN(feed_comment_id)) {
      return generalResponse(
        res,
        {},
        "Invalid feed comment ID",
        false,
        true,
        400,
      );
    }

    const comment = await FeedComment.findOne({
      where: { feed_comment_id: parseInt(feed_comment_id) },
    });

    if (!comment) {
      return generalResponse(
        res,
        {},
        "Comment or reply not found",
        false,
        true,
        404,
      );
    }

    const like = await addFeedCommentLike(parseInt(feed_comment_id), user_id);

    if (like === null) {
      // Already liked — just return current state
      return generalResponse(
        res,
        {
          feed_comment_id: parseInt(feed_comment_id),
          is_liked: true,
          total_likes: comment.total_likes,
        },
        "Comment already liked",
        false,
        true,
        409,
      );
    }

    // Get feed details
    const feed = await getFeedById(comment.feed_id);

    // Don't notify if user likes own comment
    if (comment.user_id !== user_id) {
      const notification_user = await getUser({
        user_id: comment.user_id,
      });

      if (notification_user?.device_token) {
        await sendPushNotification({
          playerIds: [notification_user.device_token],
          title: "Comment Liked",
          message: `${req.userData.full_name} has liked your comment`,
          large_icon: req.userData.profile_pic,
          big_picture:
            feed?.media?.[0]?.thumbnail_url ||
            feed?.media?.[0]?.media_url ||
            "",
          data: {
            type: "Feed Comment Like",
            feed_id: comment.feed_id,
            feed_comment_id: comment.feed_comment_id,
            user_id,
          },
        });
      }

      await createNotification({
        notification_title: "Comment Liked",
        notification_type: "Feed Comment Like",
        sender_id: user_id,
        reciever_id: comment.user_id,
        feed_id: comment.feed_id,
        notification_description: {
          description: " has liked your comment ",
          feed_id: comment.feed_id,
          feed_comment_id: comment.feed_comment_id,
          user_id,
        },
      });
    }

    return generalResponse(
      res,
      {
        feed_comment_id: parseInt(feed_comment_id),
        feed_comment_like_id: like.feed_comment_like_id,
        is_liked: true,
        total_likes: comment.total_likes + 1,
      },
      "Comment liked successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in likeComment:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while liking comment",
      false,
      true,
      500,
    );
  }
}

/**
 * Unlike a feed comment OR a reply (sub-comment)
 * POST /api/feed/unlike-comment
 * Body: { feed_comment_id }
 */
async function unlikeComment(req, res) {
  try {
    const { feed_comment_id } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_comment_id || isNaN(feed_comment_id)) {
      return generalResponse(
        res,
        {},
        "Invalid feed comment ID",
        false,
        true,
        400,
      );
    }

    // Verify the comment (or reply) exists
    const { FeedComment } = require("../../../models");
    const comment = await FeedComment.findOne({
      where: { feed_comment_id: parseInt(feed_comment_id) },
    });

    if (!comment) {
      return generalResponse(
        res,
        {},
        "Comment or reply not found",
        false,
        true,
        404,
      );
    }

    const result = await removeFeedCommentLike(
      parseInt(feed_comment_id),
      user_id,
    );

    if (result === 0) {
      return generalResponse(
        res,
        {
          feed_comment_id: parseInt(feed_comment_id),
          is_liked: false,
          total_likes: comment.total_likes,
        },
        "Comment was not liked by user",
        false,
        true,
        404,
      );
    }

    return generalResponse(
      res,
      {
        feed_comment_id: parseInt(feed_comment_id),
        is_liked: false,
        total_likes: Math.max(0, comment.total_likes - 1),
      },
      "Comment like removed successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in unlikeComment:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while unliking comment",
      false,
      true,
      500,
    );
  }
}

/**
 * Report a feed post
 * POST /api/feed/report-feed
 */
async function reportFeedPost(req, res) {
  try {
    const { feed_id, report_type, report_description } = req.body;
    const user_id = req.authData.user_id;

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed ID", false, true, 400);
    }

    if (!report_type || report_type.trim().length === 0) {
      return generalResponse(
        res,
        {},
        "Report type is required",
        false,
        true,
        400,
      );
    }

    const reportPayload = {
      feed_id: parseInt(feed_id),
      reported_by_user_id: user_id,
      report_type,
      report_description: report_description || "",
      status: "pending",
    };

    const report = await reportFeed(reportPayload);

    return generalResponse(
      res,
      { feed_report_id: report.feed_report_id },
      "Feed post reported successfully",
      true,
      true,
      201,
    );
  } catch (error) {
    console.error("Error in reportFeedPost:", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while reporting feed post",
      false,
      true,
      500,
    );
  }
}

/**
 * Update feed status (Admin / Owner)
 * PATCH /api/feed/update-status/:feed_id
 */
async function updateFeedStatus(req, res) {
  try {
    let { status, feed_id } = req.body;

    // ✅ convert properly
    status = parseBoolean(status);

    if (!feed_id || isNaN(feed_id)) {
      return generalResponse(res, {}, "Invalid feed_id", false, true, 400);
    }

    if (typeof status !== "boolean") {
      return generalResponse(
        res,
        {},
        "Status must be true or false",
        false,
        true,
        400,
      );
    }

    const feed = await getFeedByIdAdmin(parseInt(feed_id));
    if (!feed) {
      return generalResponse(res, {}, "Feed not found", false, true, 404);
    }

    const result = await updateFeed({ status }, { feed_id: parseInt(feed_id) });

    if (result[0] === 0) {
      return generalResponse(
        res,
        {},
        "Failed to update status",
        false,
        true,
        500,
      );
    }

    return generalResponse(
      res,
      { feed_id: parseInt(feed_id), status },
      "Feed status updated successfully",
      true,
      true,
      200,
    );
  } catch (error) {
    console.error("Error in updateFeedStatus:", error);
    return generalResponse(res, {}, "Something went wrong", false, true, 500);
  }
}

async function searchFeeds(req, res) {
  try {
    const { search, page = 1, pageSize = 10 } = req.body;

    const filterPayload = {
      status: true,
      deleted_by_user: false,
      search,
    };

    const feeds = await getFeed(
      filterPayload,
      { page: Number(page), pageSize: Number(pageSize) },
      [],
      [["createdAt", "DESC"]],
    );

    if (!feeds?.Records?.length) {
      return generalResponse(
        res,
        {
          Records: [],
          Pagination: {},
        },
        "No Feeds Found",
        true,
        true,
      );
    }

    return generalResponse(res, feeds, "Feeds Found", true, false);
  } catch (error) {
    console.error(error);
    return generalResponse(res, {}, "Something went wrong", false, true);
  }
}

async function searchFeedsByLocation(req, res) {
  try {
    const { location, page = 1, pageSize = 10 } = req.body;

    const filterPayload = {
      status: true,
      deleted_by_user: false,
      location,
    };

    const feeds = await getFeed(
      filterPayload,
      {
        page: Number(page),
        pageSize: Number(pageSize),
      },
      [],
      [["createdAt", "DESC"]],
    );

    if (!feeds?.Records?.length) {
      return generalResponse(
        res,
        {
          Records: [],
          Pagination: {},
        },
        "No Feeds Found",
        true,
        true,
      );
    }

    return generalResponse(res, feeds, "Feeds Found", true, false);
  } catch (error) {
    console.error(error);
    return generalResponse(res, {}, "Something went wrong", false, true);
  }
}

async function feed_pin_unpin(req, res) {
  try {
    const user_id = req.authData.user_id;

    if (!req.body.feed_id) {
      return generalResponse(res, {}, "feed_id is required", false, true, 400);
    }

    const data = {
      feed_id: req.body.feed_id,
      pin_by: user_id,
    };

    const unPin = await deletePin(data);

    if (unPin > 0) {
      return generalResponse(res, {}, "Feed Unpinned Successfully", true, true);
    }

    await createPin(data);

    return generalResponse(res, {}, "Feed Pinned Successfully", true, true);
  } catch (error) {
    console.log(error);

    return generalResponse(res, {}, "Something went wrong", false, true);
  }
}

module.exports = {
  createFeedPost,
  getFeedPosts,
  getFeedPostDetail,
  editFeedPost,
  deleteFeedPost,
  uploadFeedMedia,
  likeFeedPost,
  unlikeFeedPost,
  getFeedPostLikes,
  addCommentToFeed,
  getFeedPostComments,
  deleteCommentFromFeed,
  addReplyToComment,
  getCommentReplies,
  likeComment,
  unlikeComment,
  saveFeedPost,
  unsaveFeedPost,
  getMyFeeds,
  getUserSavedFeedsController,
  reportFeedPost,
  uploadMediaS3,
  getPresignedUrl,
  updateFeedStatus,
  getFeedPostsAdmin,
  searchFeeds,
  searchFeedsByLocation,
  feed_pin_unpin,
};
