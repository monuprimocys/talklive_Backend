const message_service = require("../../service/repository/Message.service");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { generalResponse } = require("../../helper/response.helper");
const { sendMessage } = require("./Message.cotroller.api");
const chat_service = require("../../service/repository/Chat.service");

// req: { from_chat_id, to_chat_id, message_id }
async function forwardMessage(req, res) {
  try {
    // Get user ID from authenticated request data
    const user_id = req.authData.user_id;
    let filteredData;
    try {
      // Filter and validate required fields from request body
      filteredData = updateFieldsFilter(
        req.body,
        ["from_chat_id", "message_id"],
        true
      );
      if (req.body.user_id) {
        filteredData.user_id = req.body.user_id;
      }
      if (req.body.to_chat_id) {
        filteredData.to_chat_id = req.body.to_chat_id;
      }
      if (!filteredData.user_id && !filteredData.to_chat_id) {
        return generalResponse(res, {}, "missing user_id or to_chat_id.", true, false, 402);
      }
    } catch (err) {
      // Handle validation errors
      return generalResponse(res, {}, err.message, true, false, 402);
    }
    // Check if source chat exists
    const isFromGroup = await chat_service.getChat({
      chat_id: filteredData.from_chat_id,
    });


    console.log("isFromGroup", isFromGroup);
  

    // Fetch the message to be forwarded
    let message = await message_service.getMessage({
      message_id: filteredData.message_id,
    });


    console.log("message  Debug", message);

    // Validate existence of source chat, destination chat, and message
    if (!isFromGroup || !message) {
      return generalResponse(res, {}, "Invalid data.", true, false, 402);
    } else {
      // Prepare request object for sending the forwarded message
      const messageReq = {
        ...req,
        body: {
          chat_id: filteredData.to_chat_id,
          message_content: message.dataValues.message_content,
          message_type: message.dataValues.message_type,
          message_thumbnail: message.dataValues.message_thumbnail,
          forwarded_from: filteredData.from_chat_id,
          user_id: filteredData.user_id,
              is_forwarded: true   // 👈 ADD THIS

        },
      };
      // Call sendMessage to forward the message
      return sendMessage(messageReq, res);
    }
  } catch (error) {
    // Handle unexpected errors
    return generalResponse(
      res,
      { success: false },
      error.message,
      false,
      true,
      500
    );
  }
}

module.exports = {
  forwardMessage,
};