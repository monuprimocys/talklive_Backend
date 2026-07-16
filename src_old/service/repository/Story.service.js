const {
  Story,
  StoryMedia,
  StoryView,
  User,
  Music,
} = require("../../../models");
const { Op } = require("sequelize");

async function createStory(payload) {
  try {
    const story = await Story.create(payload);
    return story;
  } catch (err) {
    console.error("createStory error:", err);
    throw err;
  }
}

async function createStoryMedia(payload) {
  try {
    const media = await StoryMedia.create(payload);
    return media;
  } catch (err) {
    console.error("createStoryMedia error:", err);
    throw err;
  }
}

async function addView(story_id, user_id) {
  try {
    const [view, created] = await StoryView.findOrCreate({
      where: { story_id, user_id },
      defaults: { story_id, user_id },
    });

    if (created) {
      // increment total_views on Story
      await Story.increment({ total_views: 1 }, { where: { story_id } });
    }
    return { view, created };
  } catch (err) {
    console.error("addView error:", err);
    throw err;
  }
}

async function getActiveStoriesByUserIds_old(userIds = []) {
  try {
    const where = {
      user_id: userIds,
      status: true,
    };
    const stories = await Story.findAll({
      where,
      include: [
        {
          model: StoryMedia,
          as: "media",
        },
        {
          model: User,
          attributes: ["user_id", "full_name", "user_name", "profile_pic"],
        },
        {
          model: Music,
          as: "music",
          required: false, // optional
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return stories;
  } catch (err) {
    console.error("getActiveStoriesByUserIds error:", err);
    throw err;
  }
}

async function getActiveStoriesByUserIds(userIds = []) {
  try {
    const stories = await Story.findAll({
      where: {
        user_id: {
          [Op.in]: userIds,
        },
        status: true,
        expires_at: {
          [Op.gt]: new Date(), // only non-expired stories
        },
      },
      include: [
        {
          model: StoryMedia,
          as: "media",
        },
        {
          model: User,
          attributes: ["user_id", "full_name", "user_name", "profile_pic"],
        },
        {
          model: Music,
          as: "music",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return stories;
  } catch (err) {
    console.error("getActiveStoriesByUserIds error:", err);
    throw err;
  }
}

async function getActiveStoriesByUserId(user_id) {
  try {
    const stories = await Story.findAll({
      where: {
        user_id,
        status: true,
        expires_at: {
          [Op.gt]: new Date(), // only non-expired stories
        },
      },
      include: [
        {
          model: StoryMedia,
          as: "media",
        },
        {
          model: User,
          attributes: ["user_id", "full_name", "user_name", "profile_pic"],
        },
        {
          model: Music,
          as: "music",
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: StoryMedia, as: "media" }, "order", "ASC"],
      ],
    });

    return stories;
  } catch (err) {
    console.error("getActiveStoriesByUserId error:", err);
    throw err;
  }
}

async function deleteStory(where) {
  return await Story.destroy({
    where,
  });
}

async function getStory(where = {}) {
  try {
    const story = await Story.findOne({
      where,
      include: [
        {
          model: StoryMedia,
          as: "media",
        },
        {
          model: User,
          attributes: ["user_id", "full_name", "user_name", "profile_pic"],
        },
        {
          model: Music,
          as: "music",
          required: false,
        },
      ],
    });

    return story;
  } catch (err) {
    console.error("getStory error:", err);
    throw err;
  }
}

module.exports = {
  createStory,
  createStoryMedia,
  addView,
  getActiveStoriesByUserIds,
  getActiveStoriesByUserId,
  deleteStory,
  getStory,
};
