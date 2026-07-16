const { generalResponse } = require("../../helper/response.helper");
const { isFollow, createFollow, deleteFollow, getFollow } = require("../../service/repository/Follow.service");
const { isPrivate, getUser } = require("../../service/repository/user.service");
const { User } = require("../../../models");
const { isBlocked } = require("../../service/repository/Block.service");
const { createNotification } = require("../../service/repository/notification.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { Op } = require("sequelize");

async function follow_unfollow(req, res) {
    try {
        const user_id = req.body.user_id
        const follower_id = req.authData.user_id
        let followPayload = { follower_id: follower_id, user_id: user_id }
        if (!user_id || !follower_id) {
            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true,
                400
            );
        }

        const AlreadyFollow = await isFollow({ user_id: user_id, follower_id: follower_id })

        if (!AlreadyFollow) {
            
            const isUserPrivate = await isPrivate({ user_id: user_id })

            let followMessage = "Follow request sent Successfully"

            if (!isUserPrivate) {
                followPayload.approved = true
                followMessage = "Followed Successfully"
            }
            const newFollow = await createFollow(followPayload)

            const notification_user = await getUser({user_id:req.body.user_id})

            sendPushNotification(
                {
                    playerIds:[notification_user.device_token],
                    title:"New Follower",
                    message: `${req.userData.full_name} has started following you`,
                    large_icon:req.userData.profile_pic,
                    data:
                    {
                        type:'Follower',
                        user_id:req.authData.user_id,
                    }
                }
            )
            await createNotification(
                {
                    notification_title: "Follow Request",
                    notification_type: "Follow",
                    sender_id: follower_id,
                    reciever_id: Number(user_id),
                    notification_description: {
                        description: ` has started following you `,
                        follower_id: follower_id
                    }
                }
            )
            if (newFollow) {
                return generalResponse(
                    res,
                    {},
                    followMessage,
                    true,
                    true
                );
            }
             
            return generalResponse(
                res,
                {},
                "Not followed",
                true,
                false,
                400
            );
        }
        const unfollow = deleteFollow(followPayload)
        if (unfollow) {
            return generalResponse(
                res,
                {},
                "Unfollowed Successfully",
                true,
                true
            );
        }
        return generalResponse(
            res,
            {},
            "Not followed",
            true,
            false,
            400
        );
    } catch (error) {
        console.error("Error in uploading social", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while uploading social!",
            false,
            true
        );
    }
}
async function follow_follower_list(req, res) {
    try {
        if (req.body.user_id) {
            AlreadyBlocked = await isBlocked({ blocked_id: req.authData.user_id, user_id: req.body.user_id })
            if (AlreadyBlocked) {
                return generalResponse(
                    res,
                    {},
                    "You are Blocked",
                    false,
                    false,
                    404
                )
            }
        }
        const user_id = req.body.user_id || req.authData.user_id;
        const { page = 1, pageSize = 10, type, search } = req.body

        if (!user_id || !type) {
            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true,
                400
            );
        }
        let followPayload
        let includeOptions
        if (type == "following") {
            followPayload = {
                follower_id: user_id
            }
            includeOptions = [
                {
                    model: User,
                    as: 'User',
                    attributes: ['profile_pic', 'user_id', 'full_name', 'user_name', 'email', 'country_code', 'country', 'gender', 'bio', 'profile_verification_status', 'login_verification_status', 'updatedAt', 'socket_id'],
                    ...(search && {
                        where: {
                            user_name: {
                                [Op.like]: `%${search}%`   // use Op.iLike for Postgres
                            }
                        }
                    })
                }
            ]
        }
        if (type == "follower") {
            followPayload = {
                user_id
            }
            includeOptions = [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['profile_pic', 'user_id', 'full_name', 'user_name', 'email', 'country_code', 'country', 'gender', 'bio', 'profile_verification_status', 'login_verification_status', 'updatedAt','socket_id'],
                    ...(search && {
                        where: {
                            user_name: {
                                [Op.like]: `%${search}%`   // use Op.iLike for Postgres
                            }
                        }
                    })
                }
            ]
        }

        const follow_list = await getFollow(followPayload, includeOptions, pagination = { page, pageSize })

        if (follow_list.Pagination.total_records == 0) {
            

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {
                        total_pages: 0,
                        total_records: 0,
                        current_page: 1,
                        records_per_page: 10
                    }
                },
                "No followers / following found",
                true,
                true,
                200
            );

        }
        await Promise.all(follow_list.Records.map(async (element) => {
            if(type == "follower"){
                const isFollowed = await isFollow({ user_id: element.follower.user_id, follower_id: req.authData.user_id });
                element.dataValues.isFollowed = isFollowed ? true : false;
            }
            if(type == "following"){
                const isFollowed = await isFollow({ user_id: element.User.user_id, follower_id: req.authData.user_id });
                element.dataValues.isFollowed = isFollowed ? true : false;
            }
            
        }));
        return generalResponse(
            res,
            follow_list,
            "List found",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in get following follower list", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while geting following follower list",
            false,
            true
        );
    }
}
async function follow_follower_list_admin(req, res) {
    try {
        
        const user_id = req.body.user_id ;
        const { page = 1, pageSize = 10, type } = req.body
 
        if (!user_id || !type) {
            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true,
                400
            );
        }
        let followPayload
        let includeOptions
        if (type == "following") {
            followPayload = {
                follower_id: user_id
            }
            includeOptions = [
                {
                    model: User,
                    as: 'User',
                    attributes: ['profile_pic', 'user_id', 'full_name', 'user_name', 'email', 'country_code', 'country', 'gender', 'bio', 'profile_verification_status', 'login_verification_status', 'updatedAt', 'socket_id']
                }
            ]
        }
        if (type == "follower") {
            followPayload = {
                user_id
            }
            includeOptions = [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['profile_pic', 'user_id', 'full_name', 'user_name', 'email', 'country_code', 'country', 'gender', 'bio', 'profile_verification_status', 'login_verification_status', 'updatedAt','socket_id']
                }
            ]
        }

        const follow_list = await getFollow(followPayload, includeOptions, pagination = { page, pageSize })

        if (follow_list.Pagination.total_records == 0) {
            

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {
                        total_pages: 0,
                        total_records: 0,
                        current_page: 1,
                        records_per_page: 10
                    }
                },
                "No followers / following found",
                true,
                true,
                200
            );

        }
        
        return generalResponse(
            res,
            follow_list,
            "List found",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in get following follower list", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while geting following follower list",
            false,
            true
        );
    }
}


module.exports = {
    follow_unfollow,
    follow_follower_list,
    follow_follower_list_admin
};  