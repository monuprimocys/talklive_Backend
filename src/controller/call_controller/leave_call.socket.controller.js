const call_service = require("../../service/repository/call.service");
const message_service = require("../../service/repository/Message.service");
const { getUser } = require("../../service/repository/user.service");
const participant_service = require("../../service/repository/Participant.service");
const { User } = require("../../../models");
const { getChat } = require("../../service/repository/Chat.service");
const CallTrackingService = require("../../service/payment/call-tracking.service");
const CoinsService = require("../../service/payment/coins.service");

/**
 * Handles when a user leaves an ongoing call.
 * Updates call status, notifies participants, and handles edge cases like missed or ended calls.
 */
async function leaveCall(socket, data, emitEvent, emitToRoom, leaveRoom) {
  try {
    // ✅ Validate required fields
    if (!data.call_id || !data.peer_id || !data.chat_id) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "call_id, chat_id & peer_id are required.",
      });
    }

    const user_id = socket.authData.user_id;
    console.log(`[leave_call] ► user_id=${user_id} call_id=${data.call_id} peer_id=${data.peer_id} chat_id=${data.chat_id} socket_id=${socket.id}`);
    // ✅ Check if user is a participant in the chat
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

    // ✅ Fetch the call by call_id
    let call = await call_service.getCall({ call_id: data.call_id });

    // ✅ Ensure the user is part of the current call session
    if (!call.current_users.includes(user_id.toString())) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "You are not in this call.",
      });
    }

    const chat = await getChat({ chat_id: data.chat_id });

    /**
     * ✅ Case 1: User is the only participant who joined the call,
     * and they leave before anyone else joins → Mark as "missed call".
     */
    if (
      call.current_users.length == 1 &&
      call.users.length == 1 &&
      call.current_users[0] == user_id.toString()
    ) {
      // Update original message to "missed"
      await message_service.updateMessage(
        { message_id: call.dataValues.message_id },
        { message_content: "missed" }
      );

      // Update call status to "missed"
      await call_service.updateCallStatus(data.call_id, {
        call_status: "missed",
        end_time: new Date(),
        call_duration: 0,
        current_users: [],
      });

      // ✅ Release locked coins if call was missed
      const room_id = call.room_id;
      const paymentInfo = CallTrackingService.activePayments[room_id];
      if (paymentInfo) {
        await CoinsService.releaseLockedCoins(paymentInfo.from_user_id, paymentInfo.locked_amount);
        delete CallTrackingService.activePayments[room_id];
      }

      // Fetch participants to notify about the missed call
      const participants =
        await participant_service.getParticipantWithoutPagenation(
          { chat_id: call.chat_id },
          [
            {
              model: User,
              attributes: ["user_id", "device_token", "socket_id"],
            },
          ]
        );

      // Re-fetch call details with caller info
      call = await call_service.getCall({ call_id: data.call_id }, [
        {
          model: User,
          attributes: ["user_id", "profile_pic", "full_name", "user_name"],
          as: "caller",
        },
      ]);

      // Notify all participants about the missed call
      participants.Records.map(async (user) => {
        user_data = await getUser({ user_id: user.user_id });
        emitEvent(user_data.socket_id, "missed_call", {
          ...call.dataValues,
          peer_id: data.peer_id,
        });
      });
      return; // Stop execution here for missed call case
    }

    /**
     * ✅ Case 2: User leaves but there are still other participants in the call
     */
    call = await call_service.updateCallStatus(data.call_id, {
      current_users: call.current_users.filter((user) => user != user_id),
    });
    call = call[1][0]; // Sequelize update response: [affectedRows, [updatedObjects]]

    if (!call) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "Failed to reject a call.",
      });
    }

    // Remove user from the socket room
    leaveRoom(socket, call.room_id);

    /**
     * ✅ Case 2a: Last user leaves → End the call
     */
    if (call.current_users.length <= 1) {
      // Update message to "ended"
      await message_service.updateMessage(
        { message_id: call.dataValues.message_id },
        { message_content: "ended" }
      );

      // Update call status → ended with duration
      await call_service.updateCallStatus(data.call_id, {
        call_status: "ended",
        end_time: new Date(),
        call_duration: Math.floor(
          (new Date() - new Date(call.dataValues.start_time)) / 1000
        ),
        current_users: [],
      });

      // ✅ Finalize billing or release locked coins
      const room_id = call.room_id;
      const paymentInfo = CallTrackingService.activePayments[room_id];
      if (paymentInfo) {
        const trackingResult = CallTrackingService.endCallTracking(paymentInfo.session_id);

        // If call was very short (less than 1 min) and no billing happened, release locked coins
        // Actually, startBillingLoop already does first deduction.
        // So we just need to clean up.
        delete CallTrackingService.activePayments[room_id];
      }

      // Fetch all chat participants
      const participants =
        await participant_service.getParticipantWithoutPagenation(
          { chat_id: call.chat_id },
          [
            {
              model: User,
              attributes: ["user_id", "device_token", "socket_id"],
            },
          ]
        );

      // Re-fetch call with caller info
      call = await call_service.getCall({ call_id: data.call_id }, [
        {
          model: User,
          attributes: ["user_id", "profile_pic", "full_name", "user_name"],
          as: "caller",
        },
      ]);

      // Notify all participants → "call_ended"
      participants.Records.map(async (user) => {
        user_data = await getUser({ user_id: user.user_id });
        emitEvent(user_data.socket_id, "call_ended", {
          ...call.dataValues,
          peer_id: data.peer_id,
        });
      });
    } else {
      /**
       * ✅ Case 2b: Other users still in the call → Notify that this user left
       */
      const user = await getUser({ user_id: user_id });
      call = await call_service.getCall({ call_id: data.call_id }, [
        {
          model: User,
          attributes: ["user_id", "profile_pic", "full_name", "user_name"],
          as: "caller",
        },
      ]);

      // Notify remaining users → "user_left"
      emitToRoom(call.room_id, "user_left", {
        user,
        call,
        peer_id: data.peer_id,
      });
    }
  } catch (error) {
    // ✅ Catch and notify on error
    console.error("Error in rejecting call", error);
    return emitEvent([socket.id], "call", {
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  leaveCall,
};
