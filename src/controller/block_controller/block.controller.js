const { generalResponse } = require("../../helper/response.helper");
const { User } = require("../../../models");
const {
  isBlocked,
  createBlock,
  deleteBlock,
  getblock,
} = require("../../service/repository/Block.service");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getUser } = require("../../service/repository/user.service");
const socket_service = require("../../service/common/socket.service");
const { Op } = require("sequelize");

async function block_unblock(req, res) {
  try {
    const user_id = req.body.user_id;
    const blocker_id = req.authData.user_id;
    let blockPayload = { user_id: blocker_id, blocked_id: user_id };
    if (!user_id || !blocker_id) {
      return generalResponse(res, {}, "Data is Missing", false, true, 400);
    }

    const AlreadyBlocked = await isBlocked(blockPayload);

    if (!AlreadyBlocked) {
      const newblock = await createBlock(blockPayload);

      if (newblock) {
        const blocker = await getUser({
          user_id: blocker_id,
        });

        const blockedUser = await getUser({
          user_id: user_id,
        });

        const blockPayloadEmit = {
          is_blocked: true,
          blocked_by_me: true,
          blocked_me: false,
          user_id: Number(user_id),
          target_user_id: Number(blocker_id),
          updated_at: new Date().toISOString(),
        };

        if (blocker?.socket_id) {
          //   socket_service.emitEvent(blocker.socket_id, "user_block_status", {
          //     is_blocked: true,
          //     blocked_by_me: true,
          //     blocked_me: false,
          //   });
          socket_service.emitEvent(
            blocker.socket_id,
            "user_block_status",
            blockPayloadEmit,
          );
        }

        if (blockedUser?.socket_id) {
          //   socket_service.emitEvent(blockedUser.socket_id, "user_block_status", {
          //     is_blocked: true,
          //     blocked_by_me: false,
          //     blocked_me: true,
          //   });

          socket_service.emitEvent(blockedUser.socket_id, "user_block_status", {
            ...blockPayloadEmit,
            blocked_by_me: false,
            blocked_me: true,
          });
        }

        return generalResponse(
          res,
          {},
          "User blocked successfully",
          true,
          true,
        );
      }
      return generalResponse(res, {}, "Not blocked", true, false, 400);
    }
    const unblock = await deleteBlock(blockPayload);
    if (unblock) {
      const blocker = await getUser({
        user_id: blocker_id,
      });

      const blockedUser = await getUser({
        user_id: user_id,
      });

      const unblockPayloadEmit = {
        is_blocked: false,
        blocked_by_me: false,
        blocked_me: false,
        user_id: Number(user_id),
        chat_id: Number(blocker_id),
        updated_at: new Date().toISOString(),
      };

      if (blocker?.socket_id) {
        // socket_service.emitEvent(blocker.socket_id, "user_block_status", {
        //   is_blocked: false,
        //   blocked_by_me: false,
        //   blocked_me: false,
        // });

        socket_service.emitEvent(
          blocker.socket_id,
          "user_block_status",
          unblockPayloadEmit,
        );
      }

      if (blockedUser?.socket_id) {
        // socket_service.emitEvent(blockedUser.socket_id, "user_block_status", {
        //   is_blocked: false,
        //   blocked_by_me: false,
        //   blocked_me: false,
        // });

        socket_service.emitEvent(
          blockedUser.socket_id,
          "user_block_status",
          unblockPayloadEmit,
        );
      }

      return generalResponse(
        res,
        {},
        "User Unblocked Successfully",
        true,
        true,
      );
    }

    return generalResponse(res, {}, "Not Unblocked", true, false, 400);
  } catch (error) {
    console.error("Error in blocking or unblocking user", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while blocking or unblocking user",
      false,
      true,
    );
  }
}

async function block_list(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { page = 1, pageSize = 10 } = req.body;
    if (!user_id) {
      return generalResponse(res, {}, "Data is Missing", false, true, 400);
    }

    let blockPayload = { user_id };
    let includeOptions = [
      {
        model: User,
        as: "blocked",
      },
    ];

    const block_list = await getblock(
      blockPayload,
      includeOptions,
      (pagination = { page, pageSize }),
    );

    if (block_list.Pagination.total_records == 0) {
      return generalResponse(
        res,
        {
          Records: [],
          Pagination: {
            total_pages: 0,
            total_records: 0,
            current_page: 0,
            records_per_page: 0,
          },
        },
        "No Blocked Users found",
        true,
        true,
        200,
      );
    }

    return generalResponse(res, block_list, "List found", true, false, 200);
  } catch (error) {
    console.error("Error in get Block list", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while geting Block list",
      false,
      true,
    );
  }
}
async function block_list_admin(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.body;
    const { sorted_by = "createdAt", sort_order = "DESC" } = req.body;

    allowedUpdateFields = ["user_id", "user_name"];
    let filteredData = {};
    try {
      filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
    } catch (err) {
      console.log(err);
      return generalResponse(res, {}, "Data is Missing", false, true);
    }
    let blockPayload = filteredData;
    // let includeOptions = []
    // if (filteredData?.user_name) {
    //     includeOptions = [
    //         {
    //             model: User,

    //             as: 'blocked',
    //             attributes: ["profile_pic",
    //                 "user_id",
    //                 "full_name",
    //                 "user_name",
    //                 "email",
    //                 "country_code",
    //                 "country",
    //                 "gender",
    //                 "bio",
    //                 "profile_verification_status",
    //                 "login_verification_status",
    //                 "socket_id",],
    //             required: true,
    //             where: {
    //                 user_name: {
    //                     [Op.like]: `%${filteredData.user_name}%`
    //                 }
    //             }
    //         },
    //         {
    //             model: User,
    //             as: 'blocker',
    //             attributes: ["profile_pic",
    //                 "user_id",
    //                 "full_name",
    //                 "user_name",
    //                 "email",
    //                 "country_code",
    //                 "country",
    //                 "gender",
    //                 "bio",
    //                 "profile_verification_status",
    //                 "login_verification_status",
    //                 "socket_id",]
    //         }
    //     ]
    // }
    // else {
    //     includeOptions = [
    //         {
    //             model: User,
    //             as: 'blocked',
    //             attributes: ["profile_pic",
    //                 "user_id",
    //                 "full_name",
    //                 "user_name",
    //                 "email",
    //                 "country_code",
    //                 "country",
    //                 "gender",
    //                 "bio",
    //                 "profile_verification_status",
    //                 "login_verification_status",
    //                 "socket_id",]
    //         },
    //         {
    //             model: User,
    //             as: 'blocker',
    //             attributes: ["profile_pic",
    //                 "user_id",
    //                 "full_name",
    //                 "user_name",
    //                 "email",
    //                 "country_code",
    //                 "country",
    //                 "gender",
    //                 "bio",
    //                 "profile_verification_status",
    //                 "login_verification_status",
    //                 "socket_id",]
    //         }
    //     ]

    // }

    // const block_list = await getblock(blockPayload, includeOptions, pagination = { page, pageSize })
    const commonAttributes = [
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

    const includeOptions = [
      {
        model: User,
        as: "blocked",
        attributes: commonAttributes,
        // Remove required: !!filteredData?.user_name (not needed)
        where: filteredData?.user_name
          ? {
              // Add filter directly to association
              user_name: {
                [Op.like]: `%${filteredData.user_name}%`,
              },
            }
          : undefined,
      },
      {
        model: User,
        as: "blocker",
        attributes: commonAttributes,
      },
    ];
    if (filteredData?.user_name) {
      delete filteredData.user_name;
    }
    const block_list = await getblock(
      blockPayload,
      includeOptions,
      (pagination = { page, pageSize }),
      [[sorted_by, sort_order]],
    );

    if (block_list.Pagination.total_records == 0) {
      return generalResponse(
        res,
        { Records: [] },
        "No Blocked Users found",
        true,
        true,
        200,
      );
    }

    return generalResponse(res, block_list, "List found", true, false, 200);
  } catch (error) {
    console.error("Error in get Block list", error);
    return generalResponse(
      res,
      { success: false },
      "Something went wrong while geting Block list",
      false,
      true,
    );
  }
}

module.exports = {
  block_unblock,
  block_list,
  block_list_admin,
};
