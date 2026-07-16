const call_service = require("../../service/repository/call.service");
const message_service = require("../../service/repository/Message.service");
const { getUser } = require("../../service/repository/user.service");
const participant_service = require("../../service/repository/Participant.service");
const { getChat } = require("../../service/repository/Chat.service");

/**
 * Handles declining/rejecting a call.
 *
 * @param {object} socket - The socket instance of the connected user.
 * @param {object} data - The call-related payload (contains call_id, chat_id, etc.).
 * @param {function} emitEvent - Function to emit events to specific socket(s).
 * @param {function} emitToRoom - Function to broadcast events to everyone in the room.
 */
async function declineCall(socket, data, emitEvent, emitToRoom) {
  try {



    console.log("==========================debug=============================" , socket.authData , data)

    // 🔍 Ensure `call_id` is provided
    if (!data.call_id) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "call_id is required.",
      });
    }

    const user_id = socket.authData.user_id;
    console.log(`[decline_call] ► user_id=${user_id} call_id=${data.call_id} chat_id=${data.chat_id} socket_id=${socket.id}`);

    // ✅ Verify the user is part of the chat
    const isParticipant = await participant_service.isParticipant(
      user_id,
      data.chat_id
    );
    if (!isParticipant) {
      return emitEvent([socket.id], "call", {
        success: false,
        error:
          "You are not a participant of this chat, so you cannot accept/decline this call.",
      });
    }

    // 🔍 Fetch the call details
    let call = await call_service.getCall({ call_id: data.call_id });
    if (!call) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "Failed to reject a call.",
      });
    }

    // 🔍 Fetch chat info for context (private/group)
    const chat = await getChat({ chat_id: data.chat_id });

    // 📩 If it's a private call in 'ringing' state → update message to "declined"
    if (call.call_status == "ringing" && chat.chat_type == "private") {
      await message_service.updateMessage(
        { message_id: call.message_id },
        { message_content: "declined" }
      );
    }

    // 🚫 Update call status to "rejected"
    call = await call_service.updateCallStatus(data.call_id, {
      call_status: "rejected",
      end_time: new Date(),
      call_duration: 0,
    });

    // Sequelize update returns [count, [rows]] → take the updated call
    call = call[1][0];

    // 👤 Get user info for notifying others
    const user = await getUser({ user_id: user_id });



    console.log("====================chatchatchat=======================",chat.chat_type)


    // 📢 If it's a private chat → notify the other participant
    if (chat.chat_type == "Private") {

      console.log("ggggggggggggggggggggggggggggggggggggggggggg")

      emitToRoom(call.room_id, "call_declined", {
        user,
        call,
        chat,
      });
    }
  } catch (error) {
    console.error("Error in rejecting call", error);

    // ❌ Notify the caller (user who triggered decline) about the error
    return emitEvent([socket.id], "call", {
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  declineCall,
};
