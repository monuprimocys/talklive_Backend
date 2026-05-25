const { emitEvent } = require("../../service/common/socket.service");
const call_service = require("../../service/repository/call.service");
const message_service = require("../../service/repository/Message.service");
const { getUser } = require("../../service/repository/user.service");
const participant_service = require("../../service/repository/Participant.service");
const { generateRoomId } = require("../../service/repository/call.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { User, Chat, Message } = require("../../../models");
const { getChat, createChat } = require("../../service/repository/Chat.service");
const {
  createMessageSeen,
  getMessageSeenCount,
} = require("../../service/repository/Message_seen.service");
const filterData = require("../../helper/filter.helper");
const BalanceValidator = require("../../service/payment/balance-validator.service");
const CoinsService = require("../../service/payment/coins.service");
const CallTrackingService = require("../../service/payment/call-tracking.service");

async function makeCall(req, res) {
  try {
    let { chat_id, peer_id, call_type } = req.body;
    const caller_id = req.authData?.user_id;

    console.log(
      `[make_call] ► caller_id=${caller_id} call_type=${call_type} chat_id=${chat_id} peer_id=${peer_id}`
    );

    // ✅ Validation
    if ((!chat_id && !peer_id) || !call_type) {
      return res.status(400).json({
        success: false,
        error: "chat_id or peer_id and call_type are required.",
      });
    }

    // ✅ Create or find private chat
    if (!chat_id && peer_id) {
      const privateChat =
        await participant_service.alreadyParticipantIndividual(
          caller_id,
          peer_id
        );

      if (!privateChat) {
        const newChat = await createChat({ chat_type: "private" });

        await participant_service.createParticipant({
          chat_id: newChat.dataValues.chat_id,
          user_id: caller_id,
        });

        await participant_service.createParticipant({
          chat_id: newChat.dataValues.chat_id,
          user_id: peer_id,
        });

        chat_id = newChat.dataValues.chat_id;
      } else {
        chat_id = privateChat;
      }
    }

    const user_id = caller_id;

    // ✅ Caller user
    const glob_user = await getUser({ user_id });
    if (!glob_user) {
      return res.status(400).json({
        success: false,
        error: "Caller not found",
      });
    }

    // ✅ Check participant
    const isParticipant = await participant_service.isParticipant(
      user_id,
      chat_id
    );

    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        error: "You cannot make calls in this chat.",
      });
    }

    // ✅ Participants (needed early for paid-call check)
    const participants =
      await participant_service.getParticipantWithoutPagenation(
        { chat_id },
        [
          {
            model: User,
            attributes: ["user_id", "device_token", "socket_id", "full_name"],
          },
        ]
      );

    // ✅ Generate room ID
    const room_id = generateRoomId();

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Create the call message FIRST (no call_id yet)
    // ─────────────────────────────────────────────────────────────
    const message = await message_service.createMessage({
      chat_id,
      message_content: "calling",
      message_type: "call",
      sender_id: user_id,
    });

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Failed to create call message",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Create the call WITH message_id
    // ─────────────────────────────────────────────────────────────
    const call = await call_service.makeCall({
      call_type,
      call_status: "ringing",
      call_duration: 0,
      end_time: new Date(),
      users: [user_id],
      message_id: message.message_id,   // ✅ now available
      chat_id,
      user_id,
      room_id,
      current_users: [user_id],
    });

    if (!call) {
      return res.status(400).json({
        success: false,
        error: "Failed to make call",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Update message with call_id so it's stored properly
    // ─────────────────────────────────────────────────────────────
    await message_service.updateMessage(
      { message_id: message.message_id },
      { call_id: call.call_id }
    );

    // Keep local reference up to date
    message.call_id = call.call_id;

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Paid-call handling — lock coins & start tracking
    // ─────────────────────────────────────────────────────────────
    try {
      const participantsSimple = participants?.Records || [];
      const receivers = participantsSimple.filter((p) => p.user_id !== user_id);

      if (receivers.length === 1) {
        const recipient_id = receivers[0].user_id;
        const txnType =
          String(call_type).toLowerCase() === "video"
            ? "VIDEO_CALL"
            : "VOICE_CALL";

        const preCall = await BalanceValidator.validatePreCallRequirements(
          user_id,
          recipient_id,
          txnType
        );

        if (preCall.requiresPayment) {
          const lockResult = await CoinsService.lockCoinsForCall(
            user_id,
            preCall.price
          );

          if (!lockResult.success) {
            return res.status(402).json({
              success: false,
              error: lockResult.message || "Insufficient coins to start call",
            });
          }

          const session_id = lockResult.session_id;

          CallTrackingService.startCallTracking(
            session_id,
            user_id,
            recipient_id,
            preCall.price,
            txnType
          );

          CallTrackingService.activePayments[room_id] = {
            session_id,
            locked_amount: lockResult.locked_amount || preCall.price,
            from_user_id: user_id,
            to_user_id: recipient_id,
            price_per_minute: preCall.price,
            transaction_type: txnType,
          };
        }
      }
    } catch (err) {
      console.error("Paid call setup error:", err);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Fetch enriched message for socket emission
    // ─────────────────────────────────────────────────────────────
    const includeOptionsforChat = [
      { model: Message, as: "ParentMessage" },
      { model: Message, as: "Replies" },
      {
        model: User,
        attributes: [
          "profile_pic",
          "user_id",
          "full_name",
          "user_name",
          "socket_id",
        ],
      },
      { model: Chat, as: "Chat" },
    ];

    let NewMessageAfterCreation = await message_service.getMessages(
      { message_id: message.message_id },   // ✅ message is defined now
      includeOptionsforChat,
      { page: 1, pageSize: 1 },
      []
    );

    // ✅ Seen by caller
    await createMessageSeen({
      message_seen_status: "seen",
      message_id: message.message_id,
      chat_id,
      user_id,
    });

    // ✅ Chat details
    const chat = await getChat({ chat_id });

    // ─────────────────────────────────────────────────────────────
    // STEP 6: Push notifications
    // ─────────────────────────────────────────────────────────────
    const receivers = participants.Records.filter(
      (p) => p.user_id !== user_id
    );

    const playerIds = receivers
      .map((p) => p.User?.device_token)
      .filter(Boolean);

    const callerName = glob_user.full_name;

    if (playerIds.length > 0) {
      sendPushNotification({
        playerIds,
        title: `${callerName} is calling you`,
        message: "ringing",
        data: {
          success: true,
          call: {
            ...call.dataValues,
            caller_name: callerName,
          },
          chat,
          user: {
            user_id: glob_user.user_id,
            full_name: glob_user.full_name,
            profile_pic: glob_user.profile_pic,
          },
        },
        collapse_id: call.call_id,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 7: HTTP response
    // ─────────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      call: { ...call.dataValues, caller_name: callerName },
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 8: Socket events
    // ─────────────────────────────────────────────────────────────
    const messageCopy = JSON.parse(JSON.stringify(NewMessageAfterCreation));

    for (const participant of participants.Records) {
      const user_data = await getUser({ user_id: participant.user_id });

      if (!user_data) {
        console.warn(
          `[make_call] ❌ user not found user_id=${participant.user_id}`
        );
        continue;
      }

      if (participant.user_id !== user_id) {
        // ✅ Mark as delivered for receivers
        await createMessageSeen({
          message_seen_status: "delivered",
          message_id: message.message_id,
          chat_id,
          user_id: user_data.user_id,
        });

        const unseenCount = await getMessageSeenCount({
          andConditions: { chat_id, user_id: user_data.user_id },
          orConditions: { message_seen_status: ["delivered", "sent"] },
        });

        // ✅ Incoming call event
        emitEvent(user_data.socket_id, "receiving_call", {
          call: { ...call.dataValues, caller_name: callerName },
          user: glob_user,
          chat,
        });

        messageCopy.Records[0].peerUserData = user_data;
        messageCopy.Records[0].unseen_count = unseenCount.count;
      } else {
        const safeUser = { ...glob_user.toJSON() };

        ["password", "otp", "device_token"].forEach((key) => {
          delete safeUser[key];
        });

        messageCopy.Records[0].peerUserData = safeUser;
        messageCopy.Records[0].unseen_count = 0;
      }

      messageCopy.Records[0].Calls = [call.dataValues];

      emitEvent(user_data.socket_id, "receive", messageCopy);
    }
  } catch (error) {
    console.error("Error in making call", error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = { makeCall };