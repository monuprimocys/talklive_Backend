const socket_service = require("../../service/common/socket.service");
const media_service = require("../../service/repository/Media.service");
const participant_service = require("../../service/repository/Participant.service");
const message_service = require("../../service/repository/Message.service");
const message_seen_service = require("../../service/repository/Message_seen.service");
const chat_service = require("../../service/repository/Chat.service");

const social_service = require("../../service/repository/SocialMedia.service");
const updateFieldsFilter = require("../../helper/updateField.helper");
const {
  getUser,

} = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");
const { User, Message, Social } = require("../../../models");
const filterData = require("../../helper/filter.helper");
const { sendPushNotification } = require("../../service/common/onesignal.service");

async function sendMessage(req, res) {
  try {
    const user_id = req.authData.user_id;
    const glob_user = await getUser({ user_id: user_id });
    if (!req.body.chat_type) {
      req.body.chat_type = "Private";
    }
    allowedUpdateFields = [
      "chat_id",
      "user_id",
      "participant_id",
      "reply_to",
      "chat_type",
      "message_length",
      "message_size",
      "social_id",
    ];
    allowedMandataryFields = ["message_type", "message_content"];
    let filteredData;
    let filteredDataMadatary;
    let filteredDataPayload;
    try {
      filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
      filteredDataMadatary = updateFieldsFilter(
        req.body,
        allowedMandataryFields,
        true
      );
      filteredDataPayload = { ...filteredData, ...filteredDataMadatary };
      if (filteredDataPayload.message_type == "social") {
        const isSocial = await social_service.getSocial({
          social_id: filteredDataPayload.social_id,
        });

        const shares = isSocial.Records[0].total_shares;
        await social_service.updateSocial({ social_id: filteredData.social_id }, { total_shares: shares + 1 })

        filteredDataPayload.message_content =
          isSocial.Records[0].Media[0].media_location;
        filteredDataPayload.message_thumbnail =
          isSocial.Records[0].reel_thumbnail;
      }

      if (filteredDataPayload.message_type === "image") {
        if (process.env.MEDIAFLOW == "S3") {
          if (!req.body.file_media_1) {
            return generalResponse(
              res,
              { success: false },
              "file_media_1 is required",
              false,
              true
            )
          }
          filteredDataPayload.message_content = req.body.file_media_1;

        }
        else {

          filteredDataPayload.message_content = req.files[0].path;
        }
      }
      if (filteredDataPayload.message_type === "video") {
        if (process.env.MEDIAFLOW == "S3") {
          if (!req.body.file_media_1 || !req.body.file_media_2) {
            return generalResponse(
              res,
              { success: false },
              "file_media_1 and file_media_2 are required",
              false,
              true
            )
          }


          filteredDataPayload.message_thumbnail = req.body.file_media_1;
          filteredDataPayload.message_content = req.body.file_media_2;
        }
        else {

          filteredDataPayload.message_thumbnail = req.files[0].path;
          filteredDataPayload.message_content = req.files[1].path;
        }


      }
      if (filteredDataPayload.message_type === "gif") {
        if (process.env.MEDIAFLOW == "S3") {
          if (!req.body.file_media_1) {
            return generalResponse(
              res,
              { success: false },
              "file_media_1 is required",
              false,
              true
            )
          }
          filteredDataPayload.message_content = req.body.file_media_1;

        }
        else {

          filteredDataPayload.message_content = req.files[0].path;
        }
      }
      if (filteredDataPayload.message_type === "doc") {
        if (process.env.MEDIAFLOW == "S3") {
          if (!req.body.file_media_1) {
            return generalResponse(
              res,
              { success: false },
              "file_media_1 is required",
              false,
              true
            )
          }
          filteredDataPayload.message_content = req.body.file_media_1;

        }
        else {

          filteredDataPayload.message_content = req.files[0].path;
        }
      }
    } catch (err) {
      console.log(err);
      return generalResponse(
        res,
        { success: false },
        "Data is Missing",
        false,
        true
      );
    }
    if (filteredDataPayload.user_id && !filteredDataPayload.chat_id) {
      filteredDataPayload.user_id = Number(filteredDataPayload.user_id);
      if ((await getUser({ user_id: filteredDataPayload.user_id })) == null) {
        return generalResponse(
          res,
          { success: false },
          "User not found",
          false,
          true,
          404
        );
      }

      const isChat = await participant_service.alreadyParticipantIndividual(
        user_id,
        filteredDataPayload.user_id
      );

      if (!isChat) {
        const newChat = await chat_service.createChat({
          chat_type: filteredDataPayload.chat_type,
        });

        filteredDataPayload.chat_id = newChat.chat_id;

        await participant_service.createParticipant(filteredDataPayload);
        await participant_service.createParticipant({
          user_id: user_id,
          chat_id: filteredDataPayload.chat_id,
        });
      } else {
        filteredDataPayload.chat_id = isChat;
      }
    }
    const includeOptionsforChat = [
      {
        model: Message,
        as: "ParentMessage",
      },
      {
        model: Message,
        as: "Replies",
      },

      {
        model: User,
        attributes: [
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
        ],
      },
      {
        model: Social,
        required: false,
        include: [
          {
            model: User,
            attributes: [
              "user_id",
              "full_name",
              "user_name",
              "profile_pic",
              "email",
            ],
          },
        ],
      },
    ];
    const foreignKeysConfig = [
      {
        foreign_key: "social_id",
        model: "Social",
        alias_name: "Social",
      },
    ];

    filteredDataPayload.sender_id = user_id;
    const newMessage = await message_service.createMessage(filteredDataPayload);
    const messageSeenBySender = await message_seen_service.createMessageSeen(
      {
        message_seen_status: "seen",
        message_id: newMessage.message_id,
        chat_id: filteredDataPayload.chat_id,
        user_id: glob_user.user_id
      }
    )

    if (newMessage) {
      let NewMessageAfterCreation = await message_service.getMessages(
        { message_id: newMessage.message_id },
        includeOptionsforChat,
        {
          page: 1,
          pageSize: 1,
        },
        foreignKeysConfig
      );
      const Participants =
        await participant_service.getParticipantWithoutPagenation({
          chat_id: newMessage.chat_id,
        });
      let peer_user = {};

      for (const element of Participants.Records) {
        if (element.user_id != glob_user.user_id) {
          const is_user = await getUser({
            // user_id: record.dataValues.user_id,
            user_id: element.user_id,
          });

          const keysToRemove = [
            "password",
            "otp",
            "id_proof",
            "selfie",
            "device_token",
          ];
          let user_data = { ...is_user.toJSON() };

          keysToRemove.forEach((key) => {
            user_data = filterData(user_data, key, "key");
          });
          peer_user = user_data;
        }
      }
      // else{

      // }
      for (const record of Participants.Records) {
        if (record.user_id != glob_user.user_id) {
          const is_user = await getUser({
            // user_id: record.dataValues.user_id,
            user_id: record.user_id,
          });

          const keysToRemove = [
            "password",
            "otp",
            "id_proof",
            "selfie",
            "device_token",
          ];
          let user_data = { ...is_user.toJSON() };

          keysToRemove.forEach((key) => {
            user_data = filterData(user_data, key, "key");
          });
          peer_user = user_data;

          NewMessageAfterCreation.Records[0].peerUserData = user_data;
          NewMessageAfterCreation.Records[0].unseen_count = 0;


          socket_service.emitEvent(
            glob_user.socket_id,
            "recieve",
            NewMessageAfterCreation
          );
        } else {

          const is_user = await getUser({
            // user_id: record.dataValues.user_id,
            user_id: peer_user.user_id,
          });

          const keysToRemove = [
            "password",
            "otp",
            "id_proof",
            "selfie",
            "device_token",
          ];
          let user_data = { ...glob_user.toJSON() };

          keysToRemove.forEach((key) => {
            user_data = filterData(user_data, key, "key");
          });

          NewMessageAfterCreation.Records[0].peerUserData = user_data;

          // Message Sent Logic
          // const messageSeenBySender = await message_seen_service.createMessageSeen(
          //   {
          //     message_seen_service: "sent",
          //     message_id: newMessage.message_id,
          //     chat_id: filteredDataPayload.chat_id
          //     user_id: glob_user.user_id

          //   }
          // )
          const messageDeliveredToReciver = await message_seen_service.createMessageSeen(
            {
              message_seen_status: "delivered",
              message_id: newMessage.message_id,
              chat_id: filteredDataPayload.chat_id,
              user_id: is_user.user_id
            }
          )
          const unseenCount = await message_seen_service.getMessageSeenCount(
            {
              andConditions: {
                chat_id: filteredDataPayload.chat_id,
                user_id: is_user.user_id
              },
              orConditions: {
                message_seen_status: ["delivered", "sent"],

              },
            }
          )
          NewMessageAfterCreation.Records[0].unseen_count = unseenCount.count;


          if (req.body.message_type == "text") {
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has sent you a message`,
                message: NewMessageAfterCreation.Records[0].message_content,
                large_icon: req.userData.profile_pic,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }

          if (req.body.message_type == "image") {
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has Sent you an Image`,
                message: "Image",
                large_icon: req.userData.profile_pic,
                big_picture: NewMessageAfterCreation.Records[0].message_content,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }
          if (req.body.message_type == "video") {
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has sent you a video`,
                message: "Video",
                large_icon: req.userData.profile_pic,
                big_picture: NewMessageAfterCreation.Records[0].message_thumbnail,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }
          if (req.body.message_type == "gif") {
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has sent you gif`,
                message: "Gif",
                large_icon: req.userData.profile_pic,
                big_picture: NewMessageAfterCreation.Records[0].message_content,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }
          if (req.body.message_type == "doc") {
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has sent you document file`,
                message: "Document",
                large_icon: req.userData.profile_pic,
                big_picture: NewMessageAfterCreation.Records[0].message_content,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }


          socket_service.emitEvent(
            is_user?.socket_id,
            "recieve",
            NewMessageAfterCreation
          );
          if (req.body.message_type == "social") {
            const notification_social = await social_service.getSocial({
              social_id: filteredData.social_id
            })
            sendPushNotification(
              {
                playerIds: [is_user.device_token],
                title: `${req.userData.full_name} has sent you a ${notification_social.Records[0].social_type}`,
                message: `${notification_social.Records[0].social_type}`,
                large_icon: req.userData.profile_pic,
                big_picture: notification_social.Records[0].reel_thumbnail,
                data: {
                  type: "message",
                  user_id: req.authData.user_id,
                  full_name: req.userData.full_name,
                  profile_pic: req.userData.profile_pic,
                  chat_id: filteredDataPayload.chat_id,
                  message_id: NewMessageAfterCreation.Records[0].messa_id
                }
              }
            )

          }
        }
      }
      // Reciver Logic

      return generalResponse(
        res,
        newMessage,
        "Message sent Successfully !!",
        true,
        true
      );
    }

    return generalResponse(
      res,
      {},
      "error in sending message",
      true,
      false,
      400
    );
  } catch (error) {
    console.error("Error in sending Message", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while messaging!",
      false,
      true
    );
  }
}

module.exports = { sendMessage };
