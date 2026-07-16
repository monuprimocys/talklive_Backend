const { updateUser, getUser } = require("../repository/user.service");
const {
  getParticipantWithoutPagenation,
} = require("../repository/Participant.service");
const { User } = require("../../../models");
const filterData = require("../../helper/filter.helper");
const {
  typing,
  chat_list,
  request_list,
  message_list,
  get_chat_id,
  real_time_message_seen,
  initial_onlineList,
  delete_for_everyone,
  delete_for_me,
  unsend_message,
} = require("../../controller/chat_controller/Message.controller");
const {
  start_live,
  leave_live,
  stop_live,
  join_live,
  activity_on_live,
  request_to_be_host,
  leave_live_as_host,
  accept_request_for_new_host,
  start_battle,
  join_battle,
  stop_battle,
} = require("../../controller/Live_controller/Live.controller");
const {
  leave_battle,
  activity_on_battle,
  challenge_user_for_battle,
  join_as_challenged_user,
} = require("../../controller/Battle_Controller/Battle.controller");
const {
  acceptCall,
} = require("../../controller/call_controller/accept_call.socket.controller");
const {
  declineCall,
} = require("../../controller/call_controller/decline_call.socket.controller");
const {
  leaveCall,
} = require("../../controller/call_controller/leave_call.socket.controller");
const {
  call_Changes,
} = require("../../controller/call_controller/call_changes.socket.controller");

let io;

// Initialize the socket server
const initSocket = (serverwithsockets) => {
  io = serverwithsockets;
  // Set up event listeners for socket connections
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Example: Listen for a custom event
    listenToEvent(socket, "chat_list", (data) => {
      chat_list(socket, data, emitEvent);
    });

    listenToEvent(socket, "request_list", (data) => {
      request_list(socket, data, emitEvent);
    });

    listenToEvent(socket, "message_list", (data) => {
      message_list(socket, data, emitEvent);
    });
    listenToEvent(socket, "delete_for_me", (data) => {
      delete_for_me(socket, data, emitEvent);
    });
    listenToEvent(socket, "delete_for_everyone", (data) => {
      delete_for_everyone(socket, data, emitEvent);
    });
    listenToEvent(socket, "unsend_message", (data) => {
      unsend_message(socket, data, emitEvent);
    });
    listenToEvent(socket, "typing", (data) => {
      typing(socket, data, emitEvent);
    });
    listenToEvent(socket, "initial_online_user", (data) => {
      initial_onlineList(socket, emitEvent);
    });
    listenToEvent(socket, "real_time_message_seen", (data) => {
      real_time_message_seen(socket, data, emitEvent);
    });
    listenToEventwithAck(socket, "get_chat_id", get_chat_id);
    // Live
    listenToEvent(socket, "start_live", (data) => {
      start_live(socket, data, emitEvent, joinRoom);
    });
    listenToEvent(socket, "join_live", (data) => {
      join_live(socket, data, emitEvent, joinRoom, emitToRoom);
    });
    listenToEvent(socket, "leave_live", (data) => {
      leave_live(socket, data, emitEvent, leaveRoom, emitToRoom);
    });
    listenToEvent(socket, "activity_on_live", (data) => {
      activity_on_live(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "stop_live", (data) => {
      stop_live(socket, data, emitEvent, emitToRoom, disposeRoom);
    });
    listenToEvent(socket, "request_to_be_host", (data) => {
      request_to_be_host(socket, data, emitEvent, joinRoom, emitToRoom);
    });
    listenToEvent(socket, "accept_request_for_new_host", (data) => {
      accept_request_for_new_host(
        socket,
        data,
        emitEvent,
        joinRoom,
        emitToRoom,
        io,
      );
    });
    listenToEvent(socket, "leave_live_as_host", (data) => {
      leave_live_as_host(socket, data, emitEvent, leaveRoom, emitToRoom);
    });
    // Battle
    listenToEvent(socket, "start_battle", (data) => {
      start_battle(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "join_battle", (data) => {
      join_battle(socket, data, emitEvent, joinRoom, emitToRoom);
    });
    listenToEvent(socket, "leave_battle", (data) => {
      leave_battle(socket, data, emitEvent, leaveRoom, emitToRoom);
    });
    listenToEvent(socket, "activity_on_battle", (data) => {
      activity_on_battle(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "stop_battle", (data) => {
      stop_battle(socket, data, emitEvent, emitToRoom, disposeRoom);
    });
    // listenToEvent(socket, "challenge_user_for_battle", (data) => {
    //   challenge_user_for_battle(socket, data, emitEvent, joinRoom, emitToRoom);
    // });
    // listenToEvent(socket, "join_as_challenged_user", (data) => {
    //   join_as_challenged_user(socket, data, emitEvent, joinRoom, emitToRoom, io);
    // });
    listenToEvent(socket, "leave_live_as_host", (data) => {
      leave_live_as_host(socket, data, emitEvent, leaveRoom, emitToRoom);
    });

    //  Call Realted Values

    listenToEvent(socket, "accept_call", (data) => {
      acceptCall(socket, data, emitEvent, emitToRoom, joinRoom);
    });
    listenToEvent(socket, "decline_call", (data) => {
      declineCall(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "leave_call", (data) => {
      leaveCall(socket, data, emitEvent, emitToRoom, leaveRoom);
    });
    listenToEvent(socket, "call_changes", (data) => {
      call_Changes(socket, data, emitEvent, emitToRoom);
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      await updateUser({ socket_id: "" }, { user_id: socket.authData.user_id });
      const isUser = await getUser({ user_id: socket.authData.user_id });
      if (!isUser) {
        return new Error("User not found.");
      }
      attributes = [
        "profile_pic",
        "user_id",
        "full_name",
        "user_name",
        "email",
        "country_code",
        "country",
        "gender",
        "bio",
        "profile_verification_status",
        "login_verification_status",
        "socket_id",
      ];
      const userWithSelectedFields = filterData(isUser.toJSON(), attributes);
      userWithSelectedFields.isOnline = false;
      const includeOptions = [
        {
          model: User,
          as: "User",
          attributes: [
            "mobile_num",
            "profile_pic",
            "dob",
            "user_id",
            "full_name",
            "user_name",
            "email",
            "country_code",
            "socket_id",
            "login_type",
            "gender",
            "country",
            "state",
            "city",
            "bio",
            "profile_verification_status",
            "login_verification_status",
            "is_private",
            "is_admin",
            "createdAt",
            "updatedAt",
          ],
        },
      ];
      const getChats_of_users = await getParticipantWithoutPagenation(
        { user_id: isUser.user_id },
        includeOptions,
      );
      if (getChats_of_users.Records.length > 0) {
        getChats_of_users.Records.map((chats) => {
          return chats.chat_id;
        }).forEach(async (element) => {
          let users = await getParticipantWithoutPagenation(
            { chat_id: element },
            includeOptions,
          );
          users.Records.map((chats) => {
            // if (chats.dataValues.User.dataValues.user_id != updatedUser)
            emitEvent(
              chats.User.socket_id,
              "offline_user",
              userWithSelectedFields,
            );
          });
        });
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

// Emit event to a specific socket
const emitEvent = (socket_id, event, data) => {
  // Retrieve the socket instance using the socket_id
  const socket = io.sockets.sockets.get(socket_id);

  if (socket) {
    console.log("Emmited to", socket_id, "Event", event, "data", data);

    socket.emit(event, data);
  } else {
    console.warn(`Socket with ID ${socket_id} is not connected`);
  }
};

// Listen to an event from a specific socket
const listenToEvent = (socket, event, callback) => {
  socket.on(event, (data) => {
    if (callback) callback(data);
  });
};
const listenToEventwithAck = (socket, event, handler) => {
  socket.on(event, (data, clientCallback) => {
    if (handler) {
      handler(socket, data)
        .then((result) => {
          if (clientCallback) clientCallback(result);
        })
        .catch((error) => {
          console.error(`Error in event "${event}":`, error);
          if (clientCallback)
            clientCallback({ success: false, error: error.message });
        });
    }
  });
};

// Dispose of the socket server
const disposeSocket = () => {
  if (io) {
    io.close(() => {
      // console.log("Socket server disposed ✅");
    });
  } else {
    console.warn("Socket server is not initialized");
  }
};

// Broadcast event to all connected clients
const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  } else {
    console.warn("Socket server is not initialized");
  }
};

const joinRoom = (socket, roomId) => {
  if (io) {
    socket.join(roomId);
    // console.log(`Socket ${socket.id} joined room: ${roomId}`);
  } else {
    console.warn("Socket.io not initialized");
  }
};

const leaveRoom = (socket, roomId) => {
  if (io) {
    socket.leave(roomId);
    // console.log(`Socket ${socket.id} left room: ${roomId}`);
  } else {
    console.warn("Socket.io not initialized");
  }
};
const disposeRoom = (roomId) => {
  if (io) {
    const room = io.sockets.adapter.rooms.get(roomId);

    if (room) {
      // Make all sockets leave the room without disconnecting
      for (const socketId of room) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(roomId);
          // console.log(`Socket ${socket.id} left room: ${roomId}`);
        }
      }

      // Room is now empty but no disconnection happened
      // console.log(`Room ${roomId} disposed (emptied).`);
    } else {
      console.warn(`Room ${roomId} not found.`);
    }
  } else {
    console.warn("Socket.io not initialized");
  }
};

/**
 * Emit an event to a specific room
 * @param {string} roomId - Room ID to send the event to
 * @param {string} event - Event name to emit
 * @param {any} data - Data to send with the event
 */

const emitToRoom = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
    // console.log(`Event "${event}" emitted to room: ${roomId} data is ${data}\n `);
  } else {
    console.warn("Socket.io not initialized");
  }
};

const getRoomMembers = async (roomId) => {
  if (io) {
    const sockets = await ioInstance.in(roomId).allSockets();
    return Array.from(sockets);
  } else {
    console.warn("Socket.io not initialized");
    return [];
  }
};
module.exports = {
  initSocket,
  emitEvent,
  emitToRoom,
  listenToEvent,
  disposeSocket,
  broadcastEvent,
  io,
};
