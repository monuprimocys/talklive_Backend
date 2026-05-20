
const {
    getUser,
    updateUser
} = require("../../service/repository/user.service");

const { createLive, generateRoomId, getLive, deleteLive, updateLive, delete_live_host } = require("../../service/repository/Live.service");
const { generalResponse } = require("../../helper/response.helper");
const { isFollow, getFollow } = require("../../service/repository/Follow.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createLiveHost, getLiveLive_host, updateLiveHost, getLiveHostById } = require("../../service/repository/Live_host.service");
const { getCoinToCoinTransaction, getCoinToCoinTransaction_withoutPagination, updateCoinToCoinTransaction } = require("../../service/repository/Transactions/Coin_coin_transaction.service");
const {
    Live, User, Live_host
} = require("../../../models");

async function start_live(socket, data, emitEvent, joinRoom) {

    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.peer_id) {
        return emitEvent(socket.id, "start_live", "Peer id is required");
    }
    const room_id = generateRoomId();
    joinRoom(socket, room_id);
    const live_payload = {
        live_title: data.live_title,
        socket_room_id: room_id,
    }




    const newLive = await createLive(live_payload)
    if (newLive) {
        const live_host_payload = {
            user_id: isUser.user_id,
            peer_id: data.peer_id,
            live_id: newLive.live_id,
            is_main_host: true
        }
        const is_live_host_created = await createLiveHost(
            live_host_payload
        )
        const followers = await getFollow({
            user_id: socket.authData.user_id
        })


        // let playerIds = []
        // followers.Records.forEach(async element => {

        //     const user = await getUser({ user_id: element.follower_id });
        //     console.log("userrrr", user.device_token);

        //     playerIds.push(user.device_token)
        // });
        let playerIds = [];

        for (const element of followers.Records) {
            const user = await getUser({ user_id: element.follower_id });
            playerIds.push(user.device_token);
        }

        sendPushNotification(
            {
                playerIds: playerIds,
                title: `${isUser.full_name} has gone live, check now`,
                message: `${isUser.full_name} has gone live, check now`,
                large_icon: isUser.profile_pic,
                data: {
                    type: "live",
                    user_id: isUser.user_id,
                    peer_id: data.peer_id,
                    live_id: newLive.live_id,
                    is_main_host: true
                }

            }
        )
        const new_live = await getLive({ live_id: newLive.live_id })
        return emitEvent(socket.id, "start_live", new_live);
    }

    return emitEvent(socket.id, "start_live", "Failed to start live");
}
async function stop_live(socket, data, emitEvent, emitToRoom, disposeRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }
    const already_host = await getLiveLive_host({ user_id: isUser.user_id, is_main_host: true })
    if (already_host.Records < 1) {
        return emitEvent(socket.id, "stop_live", "You are not live Or the host");

    }
    const already_live = await getLive({ live_id: already_host.Records[0].live_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        // disposeRoom(socket, already_live.Records[0].socket_room_id);
        return emitEvent(socket.id, "stop_live", "You are not live");
    }


    const delete_live = await deleteLive({ live_id: already_host.Records[0].live_id });
    const update_live_host = await updateLiveHost(
        {
            live_id: already_host.Records[0].live_id,
            // user_id: isUser.user_id
        },
        {
            is_live: false
        }
    );
    if (delete_live) {
        emitToRoom(data.socket_room_id, "stop_live", {
            stop_live: true,
            live_host: already_host
        });
        disposeRoom(already_live.Records[0].socket_room_id);
        return
    }
    return emitEvent(socket.id, "stop_live", "Failed to leave live");

}
async function join_live(socket, data, emitEvent, joinRoom, emitToRoom) {
    try {

        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.socket_room_id && !data.user_id && !data.peer_id) {
            return emitEvent(socket.id, "join_live", "Data is missing");
        }

        const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

        if (already_live.Records.length <= 0) {
            return emitEvent(socket.id, "join_live", {
                is_live: false,
            });
        }
        joinRoom(socket, data.socket_room_id);

        await updateLive(
            {
                socket_room_id: data.socket_room_id,
                live_id: already_live.Records[0].live_id
            },
            {
                total_viewers: already_live.Records[0].total_viewers + 1,
                curent_viewers: already_live.Records[0].curent_viewers + 1
            }
        );

        return emitToRoom(data.socket_room_id, "join_live", {
            total_viewers: already_live.Records[0].total_viewers + 1,
            curent_viewers: already_live.Records[0].curent_viewers + 1,
            likes: already_live.Records[0].likes,
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic
            },
            peer_id: already_live.Records[0].Live_hosts,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true
        });
    }
    catch (error) {
        console.log("error in join live", error);

        return emitEvent(socket.id, "join_live", error);

    }

}
async function request_to_be_host(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.peer_id) {
        return emitEvent(socket.id, "request_to_be_host", "Data is missing");
    }

    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "request_to_be_host", {
            is_live: false,
        });
    }
    // joinRoom(socket, data.socket_room_id);

    // await updateLive(
    //     {
    //         socket_room_id: data.socket_room_id,
    //         user_id: data.user_id
    //     },
    //     {
    //         total_viewers: already_live.Records[0].total_viewers + 1,
    //         curent_viewers: already_live.Records[0].curent_viewers + 1
    //     }
    // );
    const live_host = await getLiveLive_host({ live_id: already_live.Records[0].live_id, is_main_host: true, is_live: true })
    const main_streamer = await getUser({ user_id: live_host.Records[0].user_id })

    if (!live_host) {
        return emitEvent(socket.id, "request_to_be_host", {
            is_user: false
        })
    }
    // for 
    return emitEvent(main_streamer?.socket_id, 'request_to_be_host',
        {
            message: "A User wants to join as host",
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic,
                peer_id: data.peer_id
            },
            // peer_id: already_live.Records[0].peer_id,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true

        }
    )
}
async function accept_request_for_new_host(socket, data, emitEvent, joinRoom, emitToRoom, io) {
    try {

        console.log("triggreed accept_request_for_new_host");

        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.socket_room_id && !data.user_id && !data.peer_id && !data.new_host_peer_id) {
            return emitEvent(socket.id, "accept_request_for_new_host", "Data is missing");
        }

        const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

        if (already_live?.Records?.length <= 0) {
            return emitEvent(socket.id, "accept_request_for_new_host", {
                is_live: false,
            });
        }

        const new_host = await getUser({ user_id: data.user_id })
        const connect_new_host = await createLiveHost(
            {
                peer_id: data.new_host_peer_id,
                user_id: data.user_id,
                live_id: already_live?.Records[0].live_id,
                is_main_host: false,
                is_live: true
            }
        )
        if (
            connect_new_host
        ) {
            const targetSocket = io.sockets.sockets.get(new_host.socket_id);
            if (!targetSocket) {
                return emitEvent(socket.id, "accept_request_for_new_host", "User is not connected");
            }
            joinRoom(targetSocket, data.socket_room_id);

            emitToRoom(data.socket_room_id, "activity_on_live", {
                message: "New Host Joined",
                User: {
                    user_id: new_host.user_id,
                    full_name: new_host.full_name,
                    first_name: new_host.first_name,
                    last_name: new_host.last_name,
                    user_name: new_host.user_name,
                    profile_pic: new_host.profile_pic,
                    peer_id: data.new_host_peer_id
                },
            })
            console.log("emmited to room", "activity_on_live");

        }
        else {
            return emitEvent(socket.id, "accept_request_for_new_host", "Failed to add new host");
        }
    } catch (error) {
        console.log("error in accept_request_for_new_host", error);

        return emitEvent(socket.id, "accept_request_for_new_host", error);
    }

    // await updateLive(
    //     {
    //         socket_room_id: data.socket_room_id,
    //         user_id: data.user_id
    //     },
    //     {
    //         total_viewers: already_live.Records[0].total_viewers + 1,
    //         curent_viewers: already_live.Records[0].curent_viewers + 1
    //     }
    // );
    // const live_host = await getLiveLive_host({ live_id: already_live.Records[0].live_id, is_main_host:true , is_live:true })
    // const main_streamer = await getUser({ user_id: live_host.user_id})
    // if (!live_host) {
    //     return emitEvent(socket.id, "request_to_be_host", {
    //         is_user: false
    //     })
    // }
    // // for 
    // return emitEvent(main_streamer.socket_id, 'request_to_be_host',
    //     {
    //         message: "A User wants to join as host",
    //         User: {
    //             user_id: isUser.user_id,
    //             full_name: isUser.full_name,
    //             first_name: isUser.first_name,
    //             last_name: isUser.last_name,
    //             user_name: isUser.user_name,
    //             profile_pic: isUser.profile_pic,
    //             peer_id:data.peer_id
    //         },
    //         // peer_id: already_live.Records[0].peer_id,
    //         // streamer_id: already_live.Records[0].user_id,
    //         is_live: true

    //     }
    // )
}


async function leave_live_as_host(socket, data, emitEvent, leaveRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "leave_live", "Data is missing");
    }
    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live?.Records?.length <= 0) {
        return emitEvent(socket.id, "leave_live", "You Already left");
    }
    const is_live_host = await getLiveLive_host({ live_id: already_live.Records[0].live_id, user_id: isUser.user_id, is_main_host: false })
    if (is_live_host?.Records?.length <= 0) {
        return emitEvent(socket.id, "leave_live_as_host", "You are not a host");
    }
    const delete_live_host = await updateLiveHost(
        {
            live_host_id: is_live_host.Records[0].live_host_id,
            user_id: isUser.user_id
        },
        {
            is_live: false
        }
    );
    if (!delete_live_host) {
        return emitEvent(socket.id, "leave_live_as_host", "Failed to leave as host");
    }

    // if (already_live.Records[0].curent_viewers >= 0) {
    //     const update_live = await updateLive(
    //         {
    //             socket_room_id: data.socket_room_id,
    //             live_id: already_live.Records[0].live_id
    //         },
    //         {
    //             curent_viewers: already_live.Records[0].curent_viewers - 1
    //         }
    //     );
    // }
    // if(is_live_host.Records[0].is_main_host){
    //     const delete_live = await deleteLive({ live_id: already_live.Records[0].live_id });

    //     if (delete_live) {
    //         emitToRoom(data.socket_room_id, "stop_live", {
    //             stop_live: true,
    //             live_host: is_live_host
    //         });
    //         leaveRoom(socket, data.socket_room_id);
    //         return
    //     }
    // }

    emitToRoom(data.socket_room_id, "activity_on_live", {
        // total_viewers: already_live.Records[0].total_viewers,
        // curent_viewers: already_live.Records[0].curent_viewers - 1,
        message: "Host Left",

        User: {
            user_id: isUser.user_id,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            peer_id: data.peer_id
        }
    });
    // leaveRoom(socket, data.socket_room_id);

}




// async function leave_live(socket, data, emitEvent, leaveRoom, emitToRoom) {
//     console.log("leave_live*****", data,socket.authData.user_id, socket.id, emitEvent, emitToRoom);
//     const isUser = await getUser({ user_id: socket.authData.user_id });
//     console.log("leave_live*****isUser", isUser);
//     if (!isUser) {
//         return next(new Error("User not found."));
//     }

//     if (!data.socket_room_id && !data.user_id) {
//         return emitEvent(socket.id, "leave_live", "Data is missing");
//     }
//     const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });
//     console.log("leave_live*****already_live=====> ", already_live);
//     if (already_live.Records.length <= 0) {
//         return emitEvent(socket.id, "leave_live", "You Already left");
//     }
//     console.log("leave_live*****already_live=====>next stepupdate====> ", already_live);
//     if (already_live.Records[0].curent_viewers >= 0) {
//         const update_live = await updateLive(
//             {
//                 socket_room_id: data.socket_room_id,
//                 live_id: already_live.Records[0].live_id
//             },
//             {
//                 curent_viewers: already_live.Records[0].curent_viewers - 1
//             }
//         );
//     }
//     emitToRoom(data.socket_room_id, "leave_live", {
//         total_viewers: already_live.Records[0].total_viewers,
//         curent_viewers: already_live.Records[0].curent_viewers - 1,
//         User: {
//             user_id: isUser.user_id,
//             full_name: isUser.full_name,
//             first_name: isUser.first_name,
//             last_name: isUser.last_name,
//             user_name: isUser.user_name,
//             profile_pic: isUser.profile_pic,
//             peer_id: data.peer_id
//         }
//     });
//     leaveRoom(socket, data.socket_room_id);
// }


async function leave_live(socket, data, emitEvent, leaveRoom, emitToRoom) {
    console.log("leave_live*****", data, socket.authData.user_id);

    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return emitEvent(socket.id, "leave_live", "User not found");
    }

    if (!data.socket_room_id) {
        return emitEvent(socket.id, "leave_live", "Data is missing");
    }

    const already_live = await getLive({
        socket_room_id: data.socket_room_id,
        live_status: "live"
    });

    if (!already_live?.Records?.length) {
        return emitEvent(socket.id, "leave_live", "You already left");
    }

    const live = already_live.Records[0];

    /* 🔥 DELETE USER FROM live_host */
    await delete_live_host({
        user_id: isUser.user_id,
        live_id: live.live_id
    });

    /* 🔢 UPDATE VIEWER COUNT */
    if (live.curent_viewers > 0) {
        await updateLive(
            {
                socket_room_id: data.socket_room_id,
                live_id: live.live_id
            },
            {
                curent_viewers: live.curent_viewers - 1
            }
        );
    }

    /* 📡 EMIT TO ROOM */
    emitToRoom(data.socket_room_id, "leave_live", {
        total_viewers: live.total_viewers,
        curent_viewers: live.curent_viewers - 1,
        User: {
            user_id: isUser.user_id,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            peer_id: data.peer_id
        }
    });

    /* 🚪 LEAVE SOCKET ROOM */
    leaveRoom(socket, data.socket_room_id);
}



async function activity_on_live(socket, data, emitEvent, emitToRoom) {
    try {


        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.like && !data.comment) {
            return emitEvent(socket.id, "activity_on_live", "Data is missing");
        }
        const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });
        let real_time_payload
        if (already_live?.Records.length <= 0) {
            return emitEvent(socket.id, "activity_on_live", "Live is closed");
        }
        if (data.like && data.like) {
            real_time_payload = {
                like: true,
                comment: false,
                comment_cotent: "",
                user_id: isUser.user_id,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                current_like: already_live.Records[0].likes + 1,
                total_comments: already_live.Records[0].comments
            }
            const update_live = await updateLive(
                {
                    socket_room_id: data.socket_room_id,
                    live_id: already_live.Records[0].live_id
                },
                {
                    likes: already_live.Records[0].likes + 1
                }
            );
        }
        if (data.comment && data.comment.length > 0) {
            real_time_payload = {
                like: false,
                comment: true,
                comment_cotent: data.comment,
                user_id: isUser.user_id,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                total_like: already_live.Records[0].like,
                total_comments: already_live.Records[0].comments + 1
            }
            const update_live = await updateLive(
                {
                    socket_room_id: data.socket_room_id,
                    live_id: already_live.Records[0].live_id
                },
                {
                    comments: already_live.Records[0].comments + 1
                }
            );
        }
        emitToRoom(data.socket_room_id, "activity_on_live", real_time_payload)
    } catch (error) {
        console.log("error in activity_on_live", error);

        return emitEvent(socket.id, "activity_on_live", error);
    }
}
async function get_live(req, res) {

    const isUser = await getUser({ user_id: req.authData.user_id });
    const { page = 1, pageSize = 10 } = req.body;
    const live_status = req.body.live_status || "live";
    if (!isUser) {
        return generalResponse(
            res,
            {},
            "Invalid User",
            false,
            false,
            404
        );
    }
    let live_filter = { live_status: live_status };
    if (process.env.ISDEMO != "true") {
        live_filter.is_demo = false

    }

    const already_live = await getLive(live_filter, { page, pageSize });

    if (already_live.Records.length <= 0) {
        return generalResponse(
            res,
            {},
            "No Live Found",
            true,
            false
        );
    }

    const already_live_with_follow = await Promise.all(
        already_live.Records.map(async (live) => {
            const updatedHosts = await Promise.all(
                live.Live_hosts.map(async (hosts) => {
                    const following_true = await isFollow({
                        follower_id: isUser.user_id,
                        user_id: hosts.user_id,
                    });

                    return {
                        ...hosts,
                        following: !!following_true, // simpler boolean cast
                    };
                })
            );

            return {
                ...live,
                Live_hosts: updatedHosts,
            };
        })
    );


    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        {
            Records: already_live_with_follow,
            Pagination: already_live.Pagination
        },
        "Live Found",
        true,
        true
    );
}

async function get_live_with_hosts(req, res) {

    const isUser = await getUser({ user_id: req.authData.user_id });


    const { page = 1, pageSize = 10 } = req.body;
    const live_status = req.body.live_status || "live";
    if (!isUser) {
        return generalResponse(
            res,
            {},
            "Invalid User",
            false,
            false,
            404
        );
    }
    let live_filter = { is_live: true };
    let live_where = {};
    if (process.env.ISDEMO != "true") {
        live_where.is_demo = false
    }
    const include = [
        {
            model: Live,
            where: live_where,
            include: [
                {
                    model: Live_host,
                    include: [
                        {
                            model: User,
                            attributes: {
                                exclude: [
                                    "password",
                                    "otp",
                                    "social_id",
                                    "id_proof",
                                    "selfie",
                                    "device_token",
                                    "dob",
                                    "country_code",
                                    "mobile_num",
                                    "login_type",
                                    "gender",
                                    "state",
                                    "city",
                                    "bio",
                                    "login_verification_status",
                                    "is_private",
                                    "is_admin",
                                    "intrests",
                                    "socket_id",
                                    "available_coins",
                                    "account_name",
                                    "account_number",
                                    "bank_name",
                                    "swift_code",
                                    "IFSC_code"
                                ],
                            },
                        },
                    ],
                },
            ],
        },
    ];


    const already_live = await getLiveLive_host(live_filter, { page, pageSize }, include);

    if (already_live.Records.length <= 0) {
        return generalResponse(
            res,
            {},
            "No Live Found",
            true,
            false
        );
    }


    const already_live_with_follow = await Promise.all(
        already_live.Records.map(async (hosts) => {

            const following_true = await isFollow({
                follower_id: isUser.user_id,
                user_id: hosts.user_id,
            });
            const hostjsoned = hosts.toJSON()

            return {
                ...hostjsoned,
                following: !!following_true,
            };
        })
    );
    already_live.Pagination.totalCount = already_live_with_follow.length;
    

    console.log("already_live_with_follow", already_live.Pagination);


    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        {
            Records: already_live_with_follow,
            // Pagination: already_live.Pagination
            Pagination: {
                ...already_live.Pagination,
            total_records: already_live_with_follow.length
            }
        },
        "Live Found",
        true,
        true
    );
}


async function get_live_with_hosts_id(req, res) {
    try {
        const isUser = await getUser({ user_id: req.authData.user_id });
        if (!isUser) {
            return generalResponse(res, {}, "Invalid User", false, false, 404);
        }

        const { page = 1, pageSize = 10, live_host_id } = req.body;
        if (!live_host_id) {
            return generalResponse(res, {}, "live_host_id is required", false, false, 400);
        }

        // Filter based on live_host_id
        let live_filter = { live_host_id };

        const include = [
            {
                model: Live,
                include: [{ model: Live_host }]
            },
            {
                model: User,
                attributes: {
                    exclude: [
                        "password", "otp", "social_id", "id_proof", "selfie",
                        "device_token", "dob", "country_code", "mobile_num",
                        "login_type", "gender", "state", "city", "bio",
                        "login_verification_status", "is_private", "is_admin",
                        "intrests", "socket_id", "available_coins",
                        "account_name", "account_number", "bank_name",
                        "swift_code", "IFSC_code"
                    ],
                },
            }
        ];

        const live_hosts = await getLiveHostById(live_filter, { page, pageSize }, include);

        if (live_hosts.Records.length <= 0) {
            return generalResponse(res, {}, "No Live Found", true, false);
        }

        const live_hosts_with_follow = await Promise.all(
            live_hosts.Records.map(async (host) => {
                const following_true = await isFollow({
                    follower_id: isUser.user_id,
                    user_id: host.user_id,
                });
                return { ...host.toJSON(), following: !!following_true };
            })
        );

        return generalResponse(
            res,
            {
                Records: live_hosts_with_follow,
                Pagination: live_hosts.Pagination
            },
            "Live Found",
            true,
            true
        );

    } catch (error) {
        console.error("Error in get_live_with_hosts_id:", error);
        return generalResponse(res, {}, "Something went wrong", false, false, 500);
    }
}




async function get_live_admin(req, res) {
    const { page = 1, pageSize = 10 } = req.body;

    const live_status = req.body.live_status || "";
    const { sorted_by = "createdAt", sort_order = "DESC" } = req.body

    const already_live = await getLive({ live_status: live_status }, { page, pageSize }, [], [[sorted_by, sort_order]]);

    if (already_live.Records.length <= 0) {
        return generalResponse(
            res,
            {},
            "No Live Found",
            true,
            false
        );
    }



    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        already_live,
        "Live Found",
        true,
        true
    );
}

async function start_battle(socket, data, emitEvent, emitToRoom) {

    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.live_id && data.user_id) {
        return emitEvent(socket.id, "start_battle", "live_id is required");
    }
    const is_live_host = await getLiveLive_host({ live_id: data.live_id, user_id: isUser.user_id, is_main_host: true })
    if (is_live_host.Records.length <= 0) {
        return emitEvent(socket.id, "start_battle", "You are not the main host of the live");
    }

    const is_opponent = await getUser({ user_id: data.user_id });

    if (!is_opponent) {
        return emitEvent(socket.id, "start_battle", "Opponent User not found.");
    }
    // check for existing live host 
    const is_opponent_live_host = await getLiveLive_host({ live_id: data.live_id, user_id: data.user_id, is_live: true })

    if (is_opponent_live_host.Records.length > 0) {
        const update_opponent_live_host = await updateLiveHost(
            {
                live_host_id: is_opponent_live_host.Records[0].live_host_id,
                user_id: data.user_id
            },
            {
                status: "waiting_to_join"
            }
        )
    }
    else {
        const create_opponent_live_host = await createLiveHost(
            {
                live_id: data.live_id,
                user_id: data.user_id,
                is_main_host: false,
                is_live: false,
                status: "waiting_to_join"
            }
        )
        let playerIds = [];

        const user = await getUser({ user_id: data.user_id });
        playerIds.push(user.device_token);


        sendPushNotification(
            {
                playerIds: playerIds,
                title: `${isUser.full_name} has started a Battle, check now`,
                message: `${isUser.full_name} has started a Battle, check now`,
                large_icon: isUser.profile_pic,
                data: {
                    type: "battle",
                    user_id: isUser.user_id,
                    peer_id: isUser.peer_id,
                    live: data.live_id,
                    is_main_challenger: true
                }

            }
        )

    }
    // update live to battle mode
    const update_live = await updateLive(
        {
            live_id: data.live_id
        },
        {
            live_type: "battle",
            live_status: "requested_to_battle"
        }
    )
    // conjob_for_live to check for timeout if opponent does not join in time limit update live status to not_joined

    const new_Battle = await getLive({ live_id: data.live_id })
    console.log("emitting", is_opponent.socket_id);

    emitEvent(is_opponent.socket_id, "battle_invitation", new_Battle);
    emitToRoom(new_Battle.Records[0].socket_room_id, "start_battle", new_Battle);
    return

}


async function join_battle(socket, data, emitEvent, joinRoom, emitToRoom) {
    try {


        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.status && !data.live_id && !data.peer_id) {
            return emitEvent(socket.id, "join_battle", "Data is missing");
        }
        const is_battle = await getLive({ live_id: data.live_id, live_status: "requested_to_battle", live_type: "battle" });
        if (is_battle.Records.length <= 0) {
            return emitEvent(socket.id, "join_battle", {
                is_live: false,
            });
        }
        const is_opponent_live_host = await getLiveLive_host({ live_id: data.live_id, user_id: isUser.user_id, status: "waiting_to_join" })
        if (data.status == "rejected") {
            // update live status to not joined
            const update_live = await updateLive(
                {
                    live_id: data.live_id
                },
                {
                    live_status: "not_joined"
                }
            )
            if (is_opponent_live_host.Records.length > 0) {
                const update_live_host = await updateLiveHost(
                    {
                        live_host_id: is_opponent_live_host.Records[0].live_host_id,
                        user_id: isUser.user_id
                    },
                    {
                        status: "not_joined",
                        is_live: false
                    }
                )
            }
            else {
                const create_live_host = await createLiveHost(
                    {
                        live_id: data.live_id,
                        user_id: isUser.user_id,
                        is_main_host: false,
                        is_live: false,
                        status: "not_joined"
                    }
                )
            }
            emitToRoom(is_battle.Records[0].socket_room_id, "battle_activity", {
                battle_joined: false,
                reason: "rejected_by_user"
            });
            emitEvent(socket.id, "join_battle", {
                is_live: false,
            });
            return
        }
        else if (data.status == "accepted") {
            const update_live = await updateLive(
                {
                    live_id: data.live_id,
                },
                {
                    battle_start_time: Date.now(),
                    live_status: "live"
                }
            )
            if (is_opponent_live_host.Records.length > 0) {
                const update_live_host = await updateLiveHost(
                    {
                        live_host_id: is_opponent_live_host.Records[0].live_host_id,
                        user_id: isUser.user_id
                    },
                    {
                        status: "joined",
                        is_live: true,
                        peer_id: data.peer_id
                    }
                )
                joinRoom(socket, is_battle.Records[0].socket_room_id);
                // const is_opponent_live_host_after_updation = await getLiveLive_host({ live_id: data.live_id, user_id: isUser.user_id, status: "joined" })
                const is_opponent_live_host_after_updation = await getLiveLive_host({ live_id: data.live_id })


                emitToRoom(is_battle.Records[0].socket_room_id, "battle_activity", {
                    battle_joined: true,
                    reason: "accepted_by_user",
                    data: is_opponent_live_host_after_updation.Records
                });

            }
            else {
                const create_live_host = await createLiveHost(
                    {
                        live_id: data.live_id,
                        user_id: isUser.user_id,
                        is_main_host: false,
                        is_live: true,
                        status: "joined",
                        peer_id: data.peer_id
                    }
                )
                joinRoom(socket, is_battle.Records[0].socket_room_id);
                const is_opponent_live_host_after_updation = await getLiveLive_host({ live_id: data.live_id })

                emitToRoom(is_battle.Records[0].socket_room_id, "battle_activity", {
                    battle_joined: true,
                    reason: "accepted_by_user",
                    data: is_opponent_live_host_after_updation.Records
                });

            }
            return

        }
        else {
            return emitEvent(socket.id, "join_battle", "Invalid status");
        }


    }
    catch (error) {
        console.log("error in join Battle", error);

        return emitEvent(socket.id, "join_battle", error);

    }

}

async function stop_battle(socket, data, emitEvent, emitToRoom, disposeRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!data.socket_room_id || !data.live_id) {
        return emitEvent(socket.id, "stop_battle", "Data is missing");

    }
    if (!isUser) {
        return next(new Error("User not found."));
    }
    const already_host = await getLiveLive_host({ user_id: isUser.user_id, is_main_host: true, live_id: data.live_id })
    if (already_host.Records < 1) {
        return emitEvent(socket.id, "stop_battle", "You are not live Or the host");
    }
    const already_battle = await getLive({ live_id: data.live_id, live_status: "live", live_type: "battle" });


    if (already_battle.Records.length <= 0) {
        // disposeRoom(socket, already_live.Records[0].socket_room_id);
        return emitEvent(socket.id, "stop_battle", "You are not live");
    }
    let winner_id = 0
    let winner_coins = 0
    let is_draw = false
    // get all hosts 
    const opponent = await getLiveLive_host(
        {
            live_id: data.live_id,
            is_main_host: false,
            is_live: true,
            status: "joined"
        }
    )
    console.log("already_host.Records[0].total_coins", already_host.Records[0].total_coins);
    console.log("opponent.Records[0].total_coins", opponent.Records[0].total_coins);

    if (already_host.Records[0].total_coins > opponent.Records[0].total_coins) {
        winner_id = isUser.user_id
        winner_coins = already_host.Records[0].total_coins
    }
    else if (already_host.Records[0].total_coins < opponent.Records[0].total_coins) {
        winner_id = opponent.Records[0].user_id
        winner_coins = opponent.Records[0].total_coins

    }
    else if (already_host.Records[0].total_coins == opponent.Records[0].total_coins) {
        is_draw = true
    }

    if (is_draw) {
        // update all transaction marked success and update both user accounts
        const updated_transaction = await updateCoinToCoinTransaction(
            {
                success: "success"
            },
            {
                live_id: data.live_id,
                transaction_ref: "battle",
                success: "waiting_for_battle_results"
            }
        )

        const update_host_account = await updateUser(
            {
                available_coins: Number(isUser.available_coins) + Number(already_host.Records[0].total_coins)
            },
            {
                user_id: isUser.user_id
            }
        )
        const opponent_account_details = await getUser(
            {
                user_id: opponent.Records[0].user_id
            }
        )
        const update_opponent_account = await updateUser(
            {
                available_coins: Number(opponent_account_details.available_coins) + Number(opponent.Records[0].total_coins)
            },
            {
                user_id: isUser.user_id
            }
        )
    }
    else if (winner_id != 0) {
        console.log("winner_id", winner_id);

        const updated_transaction = await updateCoinToCoinTransaction(
            {
                success: "success"
            },
            {
                live_id: data.live_id,
                transaction_ref: "battle",
                // success: "waiting_for_battle_results",
                reciever_id: winner_id
            }
        )
        console.log("updated_transaction", updated_transaction);

        const updated_lost_transaction = await updateCoinToCoinTransaction(
            {
                success: "lost"
            },
            {
                live_id: data.live_id,
                transaction_ref: "battle",
                success: "waiting_for_battle_results",
            }
        )


        const winner_account_details = await getUser(
            {
                user_id: winner_id
            }
        )
        const update_winner_account = await updateUser(
            {
                available_coins: Number(winner_account_details.available_coins) + Number(winner_coins)
            },
            {
                user_id: isUser.user_id
            }
        )
    }

    // update live
    const updated_live_after_verdict = await updateLive(
        {
            live_id: data.live_id
        },
        {
            live_status: "resulted",
            battle_end_time: Date.now()
        }
    )
    // update live hosts 
    // update main host 
    if (winner_id == isUser.user_id) {
        const updated_winner_host = await updateLiveHost(
            {
                user_id: winner_id
            },
            {
                is_winner: true
            }
        )
        const updated_lost_host = await updateLiveHost(
            {
                user_id: opponent.Records[0].user_id
            },
            {
                is_winner: false
            }
        )
    }
    if (winner_id == opponent.Records[0].user_id) {
        const updated_winner_host = await updateLiveHost(
            {
                user_id: winner_id
            },
            {
                is_winner: true
            }
        )
        const updated_lost_host = await updateLiveHost(
            {
                user_id: isUser.user_id
            },
            {
                is_winner: false
            }
        )
    }
    if (is_draw) {
        const updated_winner_host = await updateLiveHost(
            {
                user_id: opponent.Records[0].user_id
            },
            {
                is_winner: true
            }
        )
        const updated_lost_host = await updateLiveHost(
            {
                user_id: isUser.user_id
            },
            {
                is_winner: true
            }
        )
    }
    let datapaylaod = {}
    if (winner_id == 0 && !is_draw) {
        datapaylaod = {
            data: {
                winner_id: 0,
                winner_coins: 0

            },
            message: "Failed to result data"
        }
    }
    else if (winner_id != 0) {

        datapaylaod = {
            data: {
                winner_id: winner_id,
                winner_coins: winner_coins
            },
            status: "not-draw",
            message: "Winner Declared"
        }
    }
    else if (is_draw) {
        datapaylaod = {
            data: {
                winner_id: 0,
                winner_coins: 0,
            },
            status: "draw",
            message: "Battle Draw"
        }
    }
    console.log("emmited that battle is verdicted");

    emitToRoom(data.socket_room_id, "stop_battle", datapaylaod);
    // disposeRoom(already_battle.Records[0].socket_room_id);
    return


}
module.exports = {
    start_live,
    stop_live,
    join_live,
    get_live,
    leave_live,
    activity_on_live,
    get_live_admin,
    request_to_be_host,
    accept_request_for_new_host,
    leave_live_as_host,
    start_battle,
    join_battle,
    stop_battle,
    get_live_with_hosts,
    get_live_with_hosts_id
};
