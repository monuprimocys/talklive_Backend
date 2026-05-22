const { Op, Sequelize } = require('sequelize');
const { Feed, FeedMedia, FeedLike, FeedComment, FeedSave, FeedTaggedUser, FeedReport, User, FeedCommentLike } = require("../../../models");

/**
 * Create a new feed post
 * @param {Object} feedPayload - Feed post data
 * @returns {Promise<Object>} Created feed post
 */
async function createFeed(feedPayload) {
  try {
    const newFeed = await Feed.create(feedPayload);
    return newFeed;
  } catch (error) {
    console.error('Error creating Feed:', error);
    throw error;
  }
}

/**
 * Get feed posts with filtering and pagination
 * @param {Object} filterPayload - Filter conditions
 * @param {Object} pagination - Pagination params { page, pageSize }
 * @param {Array} excludedUserIds - User IDs to exclude
 * @param {Array} order - Sort order
 * @returns {Promise<Object>} Feed posts with pagination info
 */
async function getFeed(filterPayload = {}, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']], user_id) {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    // Build where condition
    let whereCondition = {
      ...filterPayload,
      deleted_by_user: false,
      status: true
    };

    // Exclude specific users if provided
    if (excludedUserIds.length > 0) {
      whereCondition.user_id = {
        [Op.notIn]: excludedUserIds
      };
    }

    // Handle hashtag search
    if (filterPayload.hashtag) {
      delete whereCondition.hashtag;
      const searchTag = filterPayload.hashtag.toLowerCase();
      whereCondition[Op.and] = Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM unnest("hashtags") AS tag 
          WHERE LOWER(tag) LIKE '%${searchTag}%'
        )
      `);
    }

    // Handle username search
    let includeOptions = [];
    if (filterPayload.user_name) {
      delete whereCondition.user_name;
      includeOptions = [
        {
          model: User,
          where: {
            user_name: {
              [Op.like]: `%${filterPayload.user_name}%`
            }
          },
          attributes: ['user_id', 'user_name', 'full_name', 'profile_pic'],
          required: true
        }
      ];
    } else {
      includeOptions = [
        {
          model: User,
          attributes: ['user_id', 'user_name', 'full_name', 'profile_pic']
        }
      ];
    }

    // Include media, likes count, comments count
    includeOptions.push({
      model: FeedMedia,
      as: 'media',
      attributes: ['feed_media_id', 'media_url', 'media_type', 'thumbnail_url', 'duration', 'width', 'height', 'order']
    });

    const { count, rows } = await Feed.findAndCountAll({
      where: whereCondition,
       attributes: {
    include: [
      [
        Sequelize.literal(`
          EXISTS (
            SELECT 1 FROM "FeedLikes" AS fl
            WHERE fl.feed_id = "Feed"."feed_id"
            AND fl.user_id = ${Number(user_id)}
          )
        `),
        "is_liked"
      ],
      [
        Sequelize.literal(`
          EXISTS (
            SELECT 1 FROM "FeedSaves" AS fs
            WHERE fs.feed_id = "Feed"."feed_id"
            AND fs.user_id = ${Number(user_id)}
          )
        `),
        "is_saved"
      ]
    ]
  },
      include: includeOptions,
      order: order,
      offset: offset,
      limit: limit,
      distinct: true,
      subQuery: false
    });

    const totalPages = Math.ceil(count / limit);

    return {
      Records: rows,
      Pagination: {
        total_records: count,
        total_pages: totalPages,
        current_page: Number(page),
        records_per_page: limit
      }
    };
  } catch (error) {
    console.error('Error fetching Feed:', error);
    throw error;
  }
}

/**
 * Get a single feed post by ID with all relationships
 * @param {Number} feedId - Feed post ID
 * @returns {Promise<Object>} Feed post with all details
 */
async function getFeedById(feedId) {
  try {
    const feed = await Feed.findOne({
      where: {
        feed_id: feedId,
        deleted_by_user: false,
        status: true
      },
      include: [
        {
          model: User,
          attributes: ['user_id', 'user_name', 'full_name', 'profile_pic', 'country']
        },
        {
          model: FeedMedia,
          as: 'media',
          attributes: ['feed_media_id', 'media_url', 'media_type', 'thumbnail_url', 'duration', 'width', 'height', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: FeedTaggedUser,
          as: 'tagged_users',
          include: [{
            model: User,
            attributes: ['user_id', 'user_name', 'full_name'],
            foreignKey: 'tagged_user_id'
          }]
        }
      ]
    });
    return feed;
  } catch (error) {
    console.error('Error fetching Feed by ID:', error);
    throw error;
  }
}

/**
 * Update feed post
 * @param {Object} updateData - Data to update
 * @param {Object} where - Where condition
 * @returns {Promise<Array>} Updated record count
 */
async function updateFeed(updateData, where) {
  try {
    const result = await Feed.update(updateData, { where });
    return result;
  } catch (error) {
    console.error('Error updating Feed:', error);
    throw error;
  }
}

/**
 * Soft delete feed post
 * @param {Number} feedId - Feed post ID
 * @returns {Promise<Array>} Updated record count
 */
async function deleteFeed(feedId) {
  try {
    const result = await Feed.update(
      {
        deleted_by_user: true,
        deleted_at: new Date(),
        status: false
      },
      { where: { feed_id: feedId } }
    );
    return result;
  } catch (error) {
    console.error('Error deleting Feed:', error);
    throw error;
  }
}

/**
 * Add media to feed post
 * @param {Object} mediaPayload - Media data
 * @returns {Promise<Object>} Created media record
 */
async function addFeedMedia(mediaPayload) {
  try {
    const media = await FeedMedia.create(mediaPayload);
    return media;
  } catch (error) {
    console.error('Error adding Feed Media:', error);
    throw error;
  }
}

/**
 * Add like to feed post
 * @param {Number} feedId - Feed post ID
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Like record or null if already liked
 */
async function addFeedLike(feedId, userId) {
  try {
    // Check if already liked
    const existingLike = await FeedLike.findOne({
      where: { feed_id: feedId, user_id: userId }
    });

    if (existingLike) {
      return null;
    }

    const like = await FeedLike.create({
      feed_id: feedId,
      user_id: userId
    });

    // Increment total_likes count
    await Feed.increment('total_likes', {
      where: { feed_id: feedId }
    });

    return like;
  } catch (error) {
    console.error('Error adding Feed Like:', error);
    throw error;
  }
}

/**
 * Remove like from feed post
 * @param {Number} feedId - Feed post ID
 * @param {Number} userId - User ID
 * @returns {Promise<Number>} Deleted record count
 */
async function removeFeedLike(feedId, userId) {
  try {
    const result = await FeedLike.destroy({
      where: { feed_id: feedId, user_id: userId }
    });

    // Decrement total_likes count if deleted
    if (result > 0) {
      await Feed.decrement('total_likes', {
        where: { feed_id: feedId }
      });
    }

    return result;
  } catch (error) {
    console.error('Error removing Feed Like:', error);
    throw error;
  }
}

/**
 * Get likes for a feed post
 * @param {Number} feedId - Feed post ID
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} Likes with pagination
 */
async function getFeedLikes(feedId, pagination = { page: 1, pageSize: 20 }) {
  try {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const { count, rows } = await FeedLike.findAndCountAll({
      where: { feed_id: feedId },
      include: [{
        model: User,
        attributes: ['user_id', 'user_name', 'full_name', 'profile_pic']
      }],
      offset: offset,
      limit: limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      Records: rows,
      Pagination: {
        total_records: count,
        total_pages: Math.ceil(count / limit),
        current_page: Number(page),
        records_per_page: limit
      }
    };
  } catch (error) {
    console.error('Error fetching Feed Likes:', error);
    throw error;
  }
}

/**
 * Add comment to feed post
 * @param {Object} commentPayload - Comment data
 * @returns {Promise<Object>} Created comment
 */
async function addFeedComment(commentPayload) {
  try {
    const comment = await FeedComment.create(commentPayload);

    // Increment total_comments count
    await Feed.increment('total_comments', {
      where: { feed_id: commentPayload.feed_id }
    });

    return comment;
  } catch (error) {
    console.error('Error adding Feed Comment:', error);
    throw error;
  }
}

/**
 * Get comments for a feed post
 * @param {Number} feedId - Feed post ID
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} Comments with pagination
 */
async function getFeedComments(feedId, pagination = { page: 1, pageSize: 20 }) {
  try {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const { count, rows } = await FeedComment.findAndCountAll({
      where: {
        feed_id: feedId,
        parent_comment_id: null // Get only top-level comments
      },
      include: [{
        model: User,
        attributes: ['user_id', 'user_name', 'full_name', 'profile_pic']
      }],
      offset: offset,
      limit: limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      Records: rows,
      Pagination: {
        total_records: count,
        total_pages: Math.ceil(count / limit),
        current_page: Number(page),
        records_per_page: limit
      }
    };
  } catch (error) {
    console.error('Error fetching Feed Comments:', error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param {Number} commentId - Comment ID
 * @returns {Promise<Number>} Deleted record count
 */
async function deleteFeedComment(commentId) {
  try {
    const comment = await FeedComment.findOne({ where: { feed_comment_id: commentId } });
    
    if (!comment) {
      return 0;
    }

    const result = await FeedComment.destroy({
      where: { feed_comment_id: commentId }
    });

    // Decrement total_comments count
    if (result > 0) {
      await Feed.decrement('total_comments', {
        where: { feed_id: comment.feed_id }
      });
    }

    return result;
  } catch (error) {
    console.error('Error deleting Feed Comment:', error);
    throw error;
  }
}

/**
 * Add save to feed post
 * @param {Number} feedId - Feed post ID
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Save record or null if already saved
 */
async function addFeedSave(feedId, userId) {
  try {
    const existingSave = await FeedSave.findOne({
      where: { feed_id: feedId, user_id: userId }
    });

    if (existingSave) {
      return null;
    }

    const save = await FeedSave.create({
      feed_id: feedId,
      user_id: userId
    });

    // Increment total_saves count
    await Feed.increment('total_saves', {
      where: { feed_id: feedId }
    });

    return save;
  } catch (error) {
    console.error('Error adding Feed Save:', error);
    throw error;
  }
}

/**
 * Remove save from feed post
 * @param {Number} feedId - Feed post ID
 * @param {Number} userId - User ID
 * @returns {Promise<Number>} Deleted record count
 */
async function removeFeedSave(feedId, userId) {
  try {
    const result = await FeedSave.destroy({
      where: { feed_id: feedId, user_id: userId }
    });

    if (result > 0) {
      await Feed.decrement('total_saves', {
        where: { feed_id: feedId }
      });
    }

    return result;
  } catch (error) {
    console.error('Error removing Feed Save:', error);
    throw error;
  }
}

/**
 * Get saved feeds for a user
 * @param {Number} userId - User ID
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} Saved feeds with pagination
 */
async function getUserSavedFeeds(userId, pagination = { page: 1, pageSize: 10 }) {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const { count, rows } = await FeedSave.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Feed,
        include: [
          {
            model: User,
            attributes: ['user_id', 'user_name', 'full_name', 'profile_pic']
          },
          {
            model: FeedMedia,
            as: 'media',
            attributes: ['feed_media_id', 'media_url', 'media_type', 'thumbnail_url', 'order']
          }
        ]
      }],
      offset: offset,
      limit: limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      Records: rows.map(item => item.Feed),
      Pagination: {
        total_records: count,
        total_pages: Math.ceil(count / limit),
        current_page: Number(page),
        records_per_page: limit
      }
    };
  } catch (error) {
    console.error('Error fetching User Saved Feeds:', error);
    throw error;
  }
}

/**
 * Extract hashtags from text
 * @param {String} text - Text content
 * @returns {Array<String>} Array of hashtags
 */
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  return hashtags.map(tag => tag.toLowerCase());
}

/**
 * Extract mentions from text
 * @param {String} text - Text content
 * @returns {Array<String>} Array of mentions
 */
function extractMentions(text) {
  if (!text) return [];
  const mentionRegex = /@[\w]+/g;
  const mentions = text.match(mentionRegex) || [];
  return mentions.map(mention => mention.substring(1).toLowerCase());
}

/**
 * Create report for feed post
 * @param {Object} reportPayload - Report data
 * @returns {Promise<Object>} Created report
 */
async function reportFeed(reportPayload) {
  try {
    const report = await FeedReport.create(reportPayload);
    return report;
  } catch (error) {
    console.error('Error reporting Feed:', error);
    throw error;
  }
}

/**
 * Get feed reports (for admin)
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} Reports with pagination
 */
async function getFeedReports(pagination = { page: 1, pageSize: 20 }) {
  try {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const { count, rows } = await FeedReport.findAndCountAll({
      include: [
        {
          model: Feed,
          include: [{ model: User, attributes: ['user_id', 'user_name', 'full_name'] }]
        },
        {
          model: User,
          attributes: ['user_id', 'user_name', 'full_name'],
          as: 'ReportedByUser'
        }
      ],
      offset: offset,
      limit: limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      Records: rows,
      Pagination: {
        total_records: count,
        total_pages: Math.ceil(count / limit),
        current_page: Number(page),
        records_per_page: limit
      }
    };
  } catch (error) {
    console.error('Error fetching Feed Reports:', error);
    throw error;
  }
}

module.exports = {
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
  deleteFeedComment,
  addFeedSave,
  removeFeedSave,
  getUserSavedFeeds,
  extractHashtags,
  extractMentions,
  reportFeed,
  getFeedReports
};
