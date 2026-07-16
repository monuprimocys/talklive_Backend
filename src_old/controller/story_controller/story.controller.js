const { generalResponse } = require("../../helper/response.helper");
const {
  uploadFileToS3,
  getPresignedUploadUrl,
} = require("../../service/common/s3.service");
const {
  createStory,
  createStoryMedia,
  addView,
  getActiveStoriesByUserIds,
  getActiveStoriesByUserId,
  deleteStory,
} = require("../../service/repository/Story.service");
const { getUser } = require("../../service/repository/user.service");
const { Follow, StoryView } = require("../../../models");

async function createStoryHandlerold(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { expires_in_hours = 24, allow_replies = true } = req.body;

    const isUser = await getUser({ user_id });
    if (!isUser) return generalResponse(res, {}, "Invalid User", false, true);

    const expires_at = new Date(
      Date.now() + Number(expires_in_hours) * 3600 * 1000,
    );

    const story = await createStory({ user_id, expires_at, allow_replies });

    // attach uploaded files (if files were uploaded via backend)
    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map((file, idx) =>
          createStoryMedia({
            story_id: story.story_id,
            media_url: file.path,
            media_type: file.mimetype.startsWith("image") ? "image" : "video",
            order: idx,
          }),
        ),
      );
    }

    return generalResponse(
      res,
      { story_id: story.story_id },
      "Story created",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to create story", false, true);
  }
}

async function createStoryHandlerwithouts3(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { expires_in_hours = 24, allow_replies = true } = req.body;

    const story = await createStory({
      user_id,
      expires_at: new Date(Date.now() + Number(expires_in_hours) * 3600 * 1000),
      allow_replies,
    });

    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file, idx) => {
          let mediaUrl = file.path;

          // S3/R2 Upload
          if (
            process.env.MEDIAFLOW === "S3" ||
            process.env.FILES_STORAGE_LOCATION === "AWSS3"
          ) {
            mediaUrl = await uploadFileToS3(file, "stories");
          }

          return createStoryMedia({
            story_id: story.story_id,
            media_url: mediaUrl,
            media_type: file.mimetype.startsWith("image/") ? "image" : "video",
            order: idx,
          });
        }),
      );
    }

    return generalResponse(
      res,
      { story_id: story.story_id },
      "Story created",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to create story", false, true);
  }
}

async function createStoryHandler(req, res) {
  try {
    const user_id = req.authData.user_id;
    const {
      expires_in_hours = 24,
      allow_replies = true,
      music_id = null,
    } = req.body;

    const isUser = await getUser({ user_id });

    if (!isUser) {
      return generalResponse(res, {}, "Invalid User", false, true);
    }

    const story = await createStory({
      user_id,
      music_id,
      expires_at: new Date(Date.now() + Number(expires_in_hours) * 3600 * 1000),
      allow_replies,
    });

    /* ---------- S3 MODE ---------- */
    if (process.env.MEDIAFLOW === "S3") {
      let i = 1;
      const mediaPromises = [];

      while (req.body[`file_media_${i}`]) {
        const mediaUrl = req.body[`file_media_${i}`];

        mediaPromises.push(
          createStoryMedia({
            story_id: story.story_id,
            media_url: mediaUrl,
            media_type: req.body[`media_type_${i}`] || "image",
            order: i - 1,
          }),
        );

        i++;
      }

      // Single file support
      if (i === 1 && req.body.file_media_1) {
        mediaPromises.push(
          createStoryMedia({
            story_id: story.story_id,
            media_url: req.body.file_media_1,
            media_type: req.body.media_type_1 || "image",
            order: 0,
          }),
        );
      }

      await Promise.all(mediaPromises);
    } else {
      /* ---------- LOCAL MODE ---------- */
      const files = req.files?.files || [];

      if (files.length > 0) {
        await Promise.all(
          files.map((file, idx) =>
            createStoryMedia({
              story_id: story.story_id,
              media_url: file.path,
              media_type: file.mimetype.startsWith("image/")
                ? "image"
                : "video",
              order: idx,
            }),
          ),
        );
      }
    }

    return generalResponse(
      res,
      { story_id: story.story_id },
      "Story created",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to create story", false, true);
  }
}

async function getStoryPresignedUrl(req, res) {
  try {
    const { file_type, mime_type } = req.body;

    let folderPath = "stories";

    if (file_type === "image") {
      folderPath = "stories/images";
    } else if (file_type === "video") {
      folderPath = "stories/videos";
    }

    const result = await getPresignedUploadUrl(
      folderPath,
      file_type,
      mime_type,
    );

    return generalResponse(
      res,
      {
        presigned_url: result.presignedUrl,
        file_url: result.fileUrl,
        key: result.key,
        file_name: result.fileName,
      },
      "Presigned URL generated successfully",
      true,
      true,
    );
  } catch (error) {
    console.error(error);

    return generalResponse(res, {}, "Failed to generate URL", false, true);
  }
}

async function markViewedHandler(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { story_id } = req.body;
    if (!story_id)
      return generalResponse(res, {}, "story_id required", false, true);

    const { created } = await addView(story_id, user_id);
    return generalResponse(
      res,
      { counted: created },
      "Marked viewed",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to mark viewed", false, true);
  }
}

async function listStoriesHandler_old(req, res) {
  try {
    // const user_id = req.authData.user_id;
    // For simplicity, fetch stories for following users + self. Reuse Follow service in future to compute list.
    // Here, accept optional `user_ids` in body for targeted fetch.
    // const user_ids = req.body.user_ids || [user_id];
    const loginUserId = req.authData.user_id;

    // Following users
    const followings = await Follow.findAll({
      where: {
        follower_id: loginUserId,
        approved: true,
      },
      attributes: ["user_id"],
    });

    const user_ids = followings.map((f) => f.user_id);

    // apni stories bhi add kar do
    user_ids.push(loginUserId);

    const stories = await getActiveStoriesByUserIds(user_ids);
    return generalResponse(
      res,
      { Records: stories },
      "Stories fetched",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to fetch stories", false, true);
  }
}

async function listStoriesHandler(req, res) {
  try {
    const loginUserId = req.authData.user_id;

    const followings = await Follow.findAll({
      where: {
        follower_id: loginUserId,
        approved: true,
      },
      attributes: ["user_id"],
    });

    const user_ids = followings.map((f) => f.user_id);
    user_ids.push(loginUserId);

    const stories = await getActiveStoriesByUserIds(user_ids);

    const viewedStories = await StoryView.findAll({
      where: {
        user_id: loginUserId, // ya user_id, jo bhi column name hai
      },
      attributes: ["story_id"],
    });

    const viewedStoryIds = new Set(viewedStories.map((item) => item.story_id));

    // Group by user
    const groupedStories = Object.values(
      stories.reduce((acc, story) => {
        const userId = story.user_id;

        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            full_name: story.User?.full_name || "",
            user_name: story.User?.user_name || "",
            profile_pic: story.User?.profile_pic || "",
            stories: [],
          };
        }

        acc[userId].stories.push({
          story_id: story.story_id,
          expires_at: story.expires_at,
          total_views: story.total_views,
          allow_replies: story.allow_replies,
          createdAt: story.createdAt,
          media: story.media,
          music: story.music,
          story_seen_status: viewedStoryIds.has(story.story_id),
        });

        return acc;
      }, {}),
    );

    return generalResponse(
      res,
      { Records: groupedStories },
      "Stories fetched",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(res, {}, "Failed to fetch stories", false, true);
  }
}

async function getUserStoryDetailHandler(req, res) {
  try {
    const user_id = req.body.user_id;

    if (!user_id || isNaN(user_id)) {
      return generalResponse(
        res,
        {},
        "Valid user_id required",
        false,
        true,
        400,
      );
    }

    const isUser = await getUser({ user_id: Number(user_id) });
    if (!isUser) {
      return generalResponse(res, {}, "User not found", false, true, 404);
    }

    const stories = await getActiveStoriesByUserId(Number(user_id));
    return generalResponse(
      res,
      { Records: stories },
      "User story details fetched",
      true,
      true,
    );
  } catch (err) {
    console.error(err);
    return generalResponse(
      res,
      {},
      "Failed to fetch user story details",
      false,
      true,
    );
  }
}

async function uploadMediaS3(req, res) {
  try {
    const file = req.file || req.files?.["file"]?.[0];

    console.log("Received Story file:", file);

    if (!file || !file.originalname || !file.mimetype) {
      return generalResponse(res, {}, "File Data is missing", false, true, 404);
    }

    const url = await uploadFileToS3(file, "stories");

    return generalResponse(
      res,
      { url },
      "Story File Uploaded Successfully",
      true,
      true,
    );
  } catch (error) {
    console.error("Story Upload Error:", error);

    return generalResponse(
      res,
      {},
      "Something went wrong while uploading story file!",
      false,
      true,
    );
  }
}

async function getPresignedUrl(req, res) {
  try {
    const { file_type, mime_type, original_name } = req.body;

    let folderPath = "stories";

    if (file_type === "image") {
      folderPath = "stories/images";
    } else if (file_type === "video") {
      folderPath = "stories/videos";
    } else if (file_type === "thumb") {
      folderPath = "stories/thumbnails";
    } else if (file_type === "gif") {
      folderPath = "stories/gifs";
    } else if (file_type === "doc") {
      folderPath = "stories/documents";
    }

    console.log(
      "Story Presigned URL Request:",
      file_type,
      mime_type,
      folderPath,
    );

    const result = await getPresignedUploadUrl(
      folderPath,
      file_type,
      mime_type,
      original_name,
    );

    console.log("Story Presigned URL Result:", result);

    return generalResponse(
      res,
      {
        presigned_url: result.presignedUrl,
        file_url: result.fileUrl,
        key: result.key,
        file_name: result.fileName,
      },
      "Story Presigned URL generated successfully",
      true,
      true,
    );
  } catch (error) {
    console.error("Story Presigned URL Error:", error);

    return generalResponse(
      res,
      {},
      "Something went wrong while generating story presigned URL!",
      false,
      true,
    );
  }
}

async function deleteStoryHandler(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { story_id } = req.params;

    if (!story_id) {
      return generalResponse(res, {}, "story_id required", false, true);
    }

    const deleted = await deleteStory({
      story_id,
      user_id,
    });

    if (!deleted) {
      return generalResponse(res, {}, "Story not found", false, true);
    }

    return generalResponse(res, {}, "Story deleted successfully", true, true);
  } catch (error) {
    console.error(error);

    return generalResponse(res, {}, "Failed to delete story", false, true);
  }
}

module.exports = {
  createStoryHandler,
  markViewedHandler,
  listStoriesHandler,
  getUserStoryDetailHandler,
  uploadMediaS3,
  getPresignedUrl,
  deleteStoryHandler,
};
