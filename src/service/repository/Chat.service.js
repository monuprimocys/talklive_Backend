const { Op } = require("sequelize");

const { Chat } = require("../../../models");
const { toJSONWithAssociations } = require("../../helper/json.hleper");

async function createChat(chatPayload) {
  try {
    const newChat = await Chat.create(chatPayload);
    return newChat;
  } catch (error) {
    console.error("Error in Creating chat", error);
    throw error;
  }
}

async function getChats(
  chatPayload,
  includeOptions = [],
  pagination = { page: 1, pageSize: 10 },
  foreignKeysConfig,
) {
  try {
    const { page, pageSize } = pagination;

    // Calculate offset and limit for pagination
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Build the query object
    const query = {
      where: {
        ...chatPayload,
      },
      include: includeOptions, // Dynamically include models
      order: [["createdAt", "DESC"]], // Sort by newest first

      limit,
      offset,
    };

    // Use findAndCountAll to get both rows and count
    const { rows, count } = await Chat.findAndCountAll(query);

    const rowsData = await toJSONWithAssociations(rows, foreignKeysConfig);

    rowsData.map((row) => {
      // Iterate through the Messages array
      row.Messages.forEach((message) => {
        // Check the social_id of each message
        if (message.social_id == 0 || message.social_id === null) {
          // Set Social to an empty array if social_id is null or 0
          message.Social = {};
        }
      });
    });
    // Prepare the structured response
    return {
      Records: rowsData,
      Pagination: {
        total_pages: Math.ceil(count / pageSize),
        total_records: count,
        current_page: page,
        records_per_page: pageSize,
      },
    };
  } catch (error) {
    console.error("Error in fetching chats:", error);
    throw error;
  }
}

async function isGroup(chat_id) {
  try {
    const is_group = await Chat.findOne({
      where: {
        chat_id: chat_id,
        chat_type: "Group",
      },
    });
    return is_group;
  } catch (error) {
    console.error("Error in checking group:", error);
    throw error;
  }
}

async function getChat(payload) {
  try {
    const chat = await Chat.findOne({ where: payload });
    return chat;
  } catch (error) {
    throw error;
  }
}

async function updateChat(where, payload) {
  try {
    return await Chat.update(payload, {
      where,
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createChat,
  getChats,
  isGroup,
  getChat,
  updateChat,
};
