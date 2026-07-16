const { generalResponse } = require("../../helper/response.helper");
const { getUser } = require("../../service/repository/user.service");
const { User } = require("../../../models");
const comment_sevice = require("../../service/repository/Comment.service");
const updateFieldsFilter = require("../../helper/updateField.helper");
const filterData = require("../../helper/filter.helper");
const { getLike } = require("../../service/repository/Like.service");
const { createNotification } = require("../../service/repository/notification.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { getSocial } = require("../../service/repository/SocialMedia.service");

async function toComment(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'social_id',
            'comment',
        ]
        if (!req.body.social_type || !req.body.user_id) {
            return generalResponse(
                res,
                {},
                "social_type and user_id are required",
                false,
                true,
                400
            )
        }
        if (req.body.comment_ref_id && !req.body.comment_owner_id) {
            return generalResponse(
                res,
                {},
                "comment_owner_id is required when comment_ref_id is provided",
                false,
                true,
                400
            )
        }
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
            filteredData.comment_by = user_id
            if (req?.body?.comment_ref_id) {
                filteredData.comment_ref_id = req.body.comment_ref_id
                const Already_comment = await comment_sevice.getComment({ comment_id: filteredData.comment_ref_id })

                if (Already_comment?.Records?.length > 0) {
                    if (Already_comment.Records[0].comment_ref_id > 0) {
                        filteredData.comment_ref_id = Already_comment.Records[0].comment_ref_id
                    }
                }
                else {
                    return generalResponse(
                        res,
                        {},
                        "Comment not found",
                        false,
                        true,
                        404
                    );
                }
            }
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }

        const newComment = await comment_sevice.createComment(filteredData)
        if (newComment) {
            const notification_user = await getUser(
                {
                    user_id: Number(req.body.user_id)
                }
            )
            const notification_social = await getSocial(
                {
                    social_id: req.body.social_id
                }
            )

            if (req.authData.user_id != Number(req.body.user_id)) {

                sendPushNotification(
                    {
                        playerIds: [notification_user.device_token],
                        title: `${req.userData.full_name} has commented on your ${req.body.social_type}`,
                        message: filteredData.comment,
                        large_icon: req.userData.profile_pic,
                        big_picture: notification_social.Records[0].reel_thumbnail,
                        data: {
                            type: "comment",
                            comment_id: newComment.comment_id,
                            user_id: req.authData.user_id,
                            social_id: newComment.social_id
                        }
                    }
                )



                await createNotification(
                    {
                        notification_title: "Commented",
                        notification_type: `commented on ${req.body.social_type}`,
                        sender_id: req.authData.user_id,
                        social_id: filteredData.social_id,
                        reciever_id: Number(req.body.user_id),
                        notification_description: {
                            description: ` has commented on your ${req.body.social_type} `,
                            comment_data: filteredData.comment,
                            social_id: filteredData.social_id,
                            social_type: req.body.social_type
                        }
                    }
                )

                if (req.body.comment_ref_id) {
                    const notification_user_comment_ref = await getUser(
                        {
                            user_id: Number(req.body.comment_owner_id)
                        }
                    )
                    sendPushNotification(
                        {
                            playerIds: [notification_user_comment_ref.device_token],
                            title: `${req.userData.full_name} has replied on your comment`,
                            message: filteredData.comment,
                            large_icon: req.userData.profile_pic,
                            big_picture: notification_social.Records[0].reel_thumbnail,
                            data: {
                                type: "comment",
                                comment_id: newComment.comment_id,
                                user_id: req.authData.user_id,
                                social_id: newComment.social_id
                            }
                        }
                    )
                    await createNotification(
                        {
                            notification_title: "Replied",
                            notification_type: `replied on your comment`,
                            sender_id: req.authData.user_id,
                            social_id: filteredData.social_id,
                            reciever_id: Number(req.body.comment_owner_id),
                            notification_description: {
                                description: ` has replied on your comment `,
                                comment_data: filteredData.comment,
                                social_id: filteredData.social_id,
                                social_type: req.body.social_type
                            }
                        }
                    )
                    if (req.body.parent_comment_owner_id) {
                        const notification_user_comment_ref_parent = await getUser(
                            {
                                user_id: Number(req.body.parent_comment_owner_id)
                            }
                        )
                        sendPushNotification(
                            {
                                playerIds: [notification_user_comment_ref_parent.device_token],
                                title: `${req.userData.full_name} has replied on your comment`,
                                message: filteredData.comment,
                                large_icon: req.userData.profile_pic,
                                big_picture: notification_social.Records[0].reel_thumbnail,
                                data: {
                                    type: "comment",
                                    comment_id: newComment.comment_id,
                                    user_id: req.authData.user_id,
                                    social_id: newComment.social_id
                                }
                            }
                        )
                        await createNotification(
                            {
                                notification_title: "Replied",
                                notification_type: `replied on your comment`,
                                sender_id: req.authData.user_id,
                                social_id: filteredData.social_id,
                                reciever_id: Number(req.body.parent_comment_owner_id),
                                notification_description: {
                                    description: ` has replied on your comment `,
                                    comment_data: filteredData.comment,
                                    social_id: filteredData.social_id,
                                    social_type: req.body.social_type
                                }
                            }
                        )
                    }
                }
            }
            return generalResponse(
                res,
                newComment,
                "Comment Successfully !!",
                true,
                true
            );
        }

        return generalResponse(
            res,
            {},
            "error in Comment",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in Comment", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while commenting!",
            false,
            true
        );
    }
}
async function comment_list(req, res) {
    try {
        const user_id = req.authData.user_id
        let { page = 1, pageSize = 10 } = req.body
        let allowedUpdateFields = [];

        allowedUpdateFields = ['social_id', 'comment_ref_id']
        let filteredData;
        let includeOptions = []
        let replyCount = 0
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);

            if (!filteredData.comment_ref_id) {
                filteredData.comment_ref_id = null
            }
            if (req?.body?.include == 'User') {
                includeOptions = [
                    {
                        model: User,
                        as: 'commenter'
                    }
                ]
            }

        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }
        if (await getUser({ user_id })) {
            const comments = await comment_sevice.getComment(filteredData, includeOptions, { page, pageSize });

            if (comments?.Records?.length <= 0) {
                return generalResponse(
                    res,
                    {
                        Records: [],
                        pagination: {}
                    },
                    "Comments not found",
                    true,
                    true,

                );
            }

            const keysToRemove = [
                "password",
                "otp",
                "social_id",
                "id_proof",
                "selfie",
                "device_token",
                "login_type",
                ""
            ];
            const commentData = await Promise.all(comments.Records.map(async (record) => {
                let rawData = { ...record }; // Extract raw object data

                // Filter the main record data
                keysToRemove.forEach((key) => {
                    rawData = filterData(rawData, key, "key");
                });

                // If 'User' exists, filter its data as well
                if (rawData.commenter && rawData.commenter) {
                    let userData = { ...rawData.commenter }; // Extract User raw data
                    // Get like status asynchronously
                    const isLiked = await getLike({ comment_id: record.comment_id, like_by: userData.user_id });


                    rawData = { ...record, isLiked: isLiked.Pagination.total_records }; // Extract raw object data

                    keysToRemove.forEach((key) => {
                        userData = filterData(userData, key, "key");
                    });
                    rawData.commenter = userData; // Replace the Sequelize User instance with plain data
                }

                return rawData; // Return the filtered data
            }));

            return generalResponse(
                res,
                {
                    Records: commentData,
                    pagination: comments.Pagination
                },
                "comment Found",
                true,
                false
            );
        } else {
            return generalResponse(
                res,
                {},
                "User not found",
                false,
                true,
                404
            );
        }

    } catch (error) {
        console.error("Error in finding social", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding social!",
            false,
            true
        );
    }
}
async function comment_list_admin(req, res) {
    try {
        const admin_id = req.authData.admin_id
        let { page = 1, pageSize = 10 } = req.body
        let allowedUpdateFields = [];

        allowedUpdateFields = ['social_id', 'comment_ref_id']
        let filteredData;
        let includeOptions = []
        let replyCount = 0
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);

            if (!filteredData.comment_ref_id) {
                filteredData.comment_ref_id = null
            }
            if (req?.body?.include == 'User') {
                includeOptions = [
                    {
                        model: User,
                        as: 'commenter'
                    }
                ]
            }

        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }
        const comments = await comment_sevice.getComment(filteredData, includeOptions, { page, pageSize });

        if (comments?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    pagination: {}
                },
                "Comments not found",
                true,
                true,

            );
        }

        const keysToRemove = [
            "password",
            "otp",
            "social_id",
            "id_proof",
            "selfie",
            "device_token",
            "login_type",
            ""
        ];
        const commentData = await Promise.all(comments?.Records?.map(async (record) => {
            let rawData = { ...record }; // Extract raw object data

            // Filter the main record data
            keysToRemove.forEach((key) => {
                rawData = filterData(rawData, key, "key");
            });

            // If 'User' exists, filter its data as well
            if (rawData.commenter && rawData.commenter) {
                let userData = { ...rawData.commenter }; // Extract User raw data
                // Get like status asynchronously
                // const isLiked = await getLike({ comment_id: record.comment_id, like_by: userData.user_id });


                // rawData = { ...record, isLiked: isLiked.Pagination.total_records }; // Extract raw object data

                keysToRemove.forEach((key) => {
                    userData = filterData(userData, key, "key");
                });
                rawData.commenter = userData; // Replace the Sequelize User instance with plain data
            }

            return rawData; // Return the filtered data
        }));

        return generalResponse(
            res,
            {
                Records: commentData,
                pagination: comments.Pagination
            },
            "comment Found",
            true,
            false
        );


    } catch (error) {
        console.error("Error in finding comments", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding comments!",
            false,
            true
        );
    }
}


module.exports = {
    toComment,
    comment_list,
    comment_list_admin
};  