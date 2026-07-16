const call_service = require("../../service/repository/call.service");
const message_service = require("../../service/repository/Message.service");
const { getUser } = require("../../service/repository/user.service");
const participant_service = require("../../service/repository/Participant.service");
const {
  sendPushNotification,
} = require("../../service/common/oneSignal.service");
const { User } = require("../../../models");
const { getChat } = require("../../service/repository/Chat.service");

async function missedCall(socket, data, emitEvent, emitToRoom) {
  try {
    // ✅ Validate required data
    if (!data.call_id || !data.chat_id) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "call_id and chat_id are required.",
      });
    }

    const user_id = socket.authData.user_id;

    // ✅ Check participant
    const isParticipant = await participant_service.isParticipant(
      user_id,
      data.chat_id
    );

    if (!isParticipant) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "You are not the participant of this chat.",
      });
    }

    // ✅ Get call
    let call = await call_service.getCall({ call_id: data.call_id });

    if (!call) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "Call not found.",
      });
    }

    // ✅ Update call → missed
    let updatedCall = await call_service.updateCallStatus(data.call_id, {
      call_status: "missed",
      end_time: new Date(),
      call_duration: 0,
    });

    call = updatedCall[1][0];

    // ✅ Get chat
    const chat = await getChat({ chat_id: call.chat_id });

    // ✅ Get caller info
    const caller = await getUser({ user_id });
    const callerName = caller.full_name;

    // ✅ Get participants
    const participants =
      await participant_service.getParticipantWithoutPagenation(
        { chat_id: call.chat_id },
        [
          {
            model: User,
            attributes: ["user_id", "device_token", "socket_id", "full_name", "profile_pic"],
          },
        ]
      );

    // ✅ Receivers (exclude caller)
    const receivers = participants.Records.filter(
      (p) => p.user_id !== user_id
    );

    // ✅ Device tokens
    const playerIds = receivers
      .map((p) => p.User?.device_token)
      .filter(Boolean);

    // ✅ Update message (only if ringing before)
    if (call.call_status === "ringing" && chat.chat_type === "private") {
      await message_service.updateMessage(
        { message_id: call.message_id },
        { message_content: "missed call" }
      );
    }

    // ✅ Send Push Notification
    if (playerIds.length > 0) {
      if (chat.chat_type === "group") {
        sendPushNotification({
          playerIds,
          title: `${chat.group_name} missed call`,
          message: "Missed group call",
          data: {
            success: true,
            call: {
              ...call.dataValues,
              caller_name: callerName,
            },
            chat,
            user: {
              user_id: caller.user_id,
              full_name: caller.full_name,
              profile_pic: caller.profile_pic,
            },
          },
          collapse_id: call.call_id,
        });
      } else {
        sendPushNotification({
          playerIds,
          title: `${callerName} missed your call`,
          message: "Missed call",
          data: {
            success: true,
            call: {
              ...call.dataValues,
              caller_name: callerName,
            },
            chat,
            user: {
              user_id: caller.user_id,
              full_name: caller.full_name,
              profile_pic: caller.profile_pic,
            },
          },
          collapse_id: call.call_id,
        });
      }
    }

    // ✅ Emit socket event to receivers
    for (const participant of receivers) {
      const socket_id = participant.User?.socket_id;

      if (socket_id) {
        emitEvent(socket_id, "missed_call", {
          user: caller,
          call,
          peer_id: data.peer_id,
        });
      }
    }

    // ✅ Emit to room (for all users in call room)
    emitToRoom(call.room_id, "missed_call", {
      user: caller,
      call,
      peer_id: data.peer_id,
    });

  } catch (error) {
    console.error("Error in missing call", error);

    return emitEvent([socket.id], "call", {
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  missedCall,
};