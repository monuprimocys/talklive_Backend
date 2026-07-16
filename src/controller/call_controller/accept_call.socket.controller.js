const call_service = require("../../service/repository/call.service");
const message_service = require("../../service/repository/Message.service");
const { getUser } = require("../../service/repository/user.service");
const participant_service = require("../../service/repository/Participant.service");
const CallTrackingService = require("../../service/payment/call-tracking.service");
const { emitEvent: socketEmit } = require("../../service/common/socket.service");

// In-memory peer map: room_id → [{ user_id, peer_id, socket_id }]
// Tracks who is already in a room so a late joiner (e.g. iOS) can call them
const roomPeerMap = {};

async function acceptCall(socket, data, emitEvent, emitToRoom, joinRoom) {
  try {
    // ✅ Validate required parameters
    if (!data.call_id || !data.peer_id) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "call_id and peer_id are required.",
      });
    }

    const user_id = socket.authData.user_id;

    // ✅ Check if the user is a participant of the chat
    const isParticipant = await participant_service.isParticipant(
      user_id,
      data.chat_id
    );
    if (!isParticipant) {
      return emitEvent([socket.id], "call", {
        success: false,
        error:
          "You are not a participant of this chat, so you cannot join this call.",
      });
    }

    // ✅ Fetch call details from DB
    let call = await call_service.getCall({ call_id: data.call_id });

    // ✅ If no active users are left in the call, consider it ended
    if (call?.current_users?.length <= 0)
      return emitEvent([socket.id], "call", {
        success: false,
        error: "Call has been ended.",
      });

    const uniqueUsers = [...new Set((call.users ?? []).map(String).concat(String(user_id)))];
    const uniqueCurrentUsers = [...new Set((call.current_users ?? []).map(String).concat(String(user_id)))];

    call = await call_service.updateCallStatus(data.call_id, {
      call_status: "ongoing",
      start_time: !call.start_time && call.users.length < 2 ? new Date() : call.start_time,
      users: uniqueUsers,
      current_users: uniqueCurrentUsers,
    });
    call = call[1][0]; // Sequelize update returns [affectedCount, updatedRows], extract updated row
    if (!call) {
      return emitEvent([socket.id], "call", {
        success: false,
        error: "Failed to accept a call.",
      });
    }

    const room_id = call.room_id;

    // ✅ Get existing peers in the room BEFORE this user joins
    // This is what we'll send to the new joiner so they can call everyone already present
    const existingPeers = roomPeerMap[room_id] ? [...roomPeerMap[room_id]] : [];

    // ✅ Add this user to the peer map
    if (!roomPeerMap[room_id]) {
      roomPeerMap[room_id] = [];
    }
    // Remove any stale entry for this user (reconnect case)
    roomPeerMap[room_id] = roomPeerMap[room_id].filter(
      (p) => p.user_id !== String(user_id)
    );
    roomPeerMap[room_id].push({
      user_id: String(user_id),
      peer_id: data.peer_id,
      socket_id: socket.id,
    });

    // ✅ Join socket room for the call AFTER capturing existing peers
    joinRoom(socket, room_id);

    // ✅ Update the related message status to "ongoing"
    await message_service.updateMessage(
      { message_id: call.message_id },
      { message_content: "ongoing" }
    );

    // ✅ Start billing loop if this is a paid call
    const paymentInfo = CallTrackingService.activePayments[room_id];
    if (paymentInfo) {
      CallTrackingService.startBillingLoop(
        paymentInfo.session_id,
        room_id,
        (room, reason) => {
          // Callback for auto-termination (e.g. out of coins)
          emitToRoom(room, "call_ended", {
            call_id: data.call_id,
            reason: reason,
            message: "Call ended due to insufficient balance"
          });
        }
      );
    }

    // ✅ Fetch user details for notifying other participants
    const user = await getUser({ user_id: user_id });

    // ✅ Notify everyone already in the room that this new user joined (they will call the new user)
    emitToRoom(room_id, "user_joined", {
      user,
      call,
      peer_id: data.peer_id,
    });

    // ✅ Send existing peers back to the NEW joiner so they can call everyone already in the room
    // This fixes the case where iOS joins after Web: iOS needs to know Web's peer_id to call Web
    if (existingPeers.length > 0) {
      console.log(`[accept_call] sending existing_peers to new joiner user_id=${user_id} peers=${JSON.stringify(existingPeers)}`);
      for (const existingPeer of existingPeers) {
        const existingUser = await getUser({ user_id: existingPeer.user_id });
        emitEvent([socket.id], "user_joined", {
          user: existingUser,
          call,
          peer_id: existingPeer.peer_id,
        });
      }
    }

  } catch (error) {
    console.error("Error in accepting call", error);

    return emitEvent([socket.id], "call", {
      success: false,
      error: error.message,
    });
  }
}

// Clean up room peer map when a call ends or user leaves
function removeFromRoomPeerMap(room_id, user_id) {
  if (!roomPeerMap[room_id]) return;
  roomPeerMap[room_id] = roomPeerMap[room_id].filter(
    (p) => p.user_id !== String(user_id)
  );
  if (roomPeerMap[room_id].length === 0) {
    delete roomPeerMap[room_id];
  }
}

function clearRoomPeerMap(room_id) {
  delete roomPeerMap[room_id];
}

module.exports = {
  acceptCall,
  removeFromRoomPeerMap,
  clearRoomPeerMap,
};
