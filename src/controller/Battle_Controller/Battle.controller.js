
const {
    getUser
} = require("../../service/repository/user.service");

const { createLive, generateRoomId, getLive, deleteLive, updateLive } = require("../../service/repository/Live.service");
const { generalResponse } = require("../../helper/response.helper");
const { isFollow, getFollow } = require("../../service/repository/Follow.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createLiveHost, getLiveLive_host, updateLiveHost } = require("../../service/repository/Live_host.service");
const { createBattle, getBattle, updateBattle, deleteBattle } = require("../../service/repository/Battle.service");
const { createBattleHost, getBattle_host, updateBattleHost } = require("../../service/repository/Battle_host.service");

async function start_battle(socket, data, emitEvent, joinRoom) {

    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.peer_id) {
        return emitEvent(socket.id, "start_battle", "Peer id is required");
    }
    const room_id = generateRoomId();
    joinRoom(socket, room_id);
    const battle_payload = {
        live_title: data.live_title,
        socket_room_id: room_id,
    }




    const newBattle = await createBattle(battle_payload)
    if (newBattle) {
        const battle_host_payload = {
            user_id: isUser.user_id,
            peer_id: data.peer_id,
            battle_id: newBattle.battle_id,
            is_main_challenger: true
        }
        const is_battle_host_created = await createBattleHost(
            battle_host_payload
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
                title: `${isUser.full_name} has started a Battle, check now`,
                message: `${isUser.full_name} has started a Battle, check now`,
                large_icon: isUser.profile_pic,
                data: {
                    type: "battle",
                    user_id: isUser.user_id,
                    peer_id: data.peer_id,
                    battle_id: newBattle.battle_id,
                    is_main_challenger: true
                }

            }
        )
        const new_Battle = await getBattle({ battle_id: newBattle.battle_id })
        return emitEvent(socket.id, "start_battle", new_Battle);
    }

    return emitEvent(socket.id, "start_battle", "Failed to start Battle");
}

async function join_battle(socket, data, emitEvent, joinRoom, emitToRoom) {
    try {



        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.socket_room_id && !data.user_id && !data.peer_id) {
            return emitEvent(socket.id, "join_battle", "Data is missing");
        }

        const already_battle = await getBattle({ socket_room_id: data.socket_room_id, live_status: "live" });

        if (already_battle.Records.length <= 0) {
            return emitEvent(socket.id, "join_battle", {
                is_live: false,
            });
        }
        joinRoom(socket, data.socket_room_id);

        await updateBattle(
            {
                socket_room_id: data.socket_room_id,
                battle_id: already_battle.Records[0].battle_id
            },
            {
                total_viewers: already_battle.Records[0].total_viewers + 1,
                curent_viewers: already_battle.Records[0].curent_viewers + 1
            }
        );

        return emitToRoom(data.socket_room_id, "join_battle", {
            total_viewers: already_battle.Records[0].total_viewers + 1,
            curent_viewers: already_battle.Records[0].curent_viewers + 1,
            likes: already_battle.Records[0].likes,
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic
            },
            peer_id: already_battle.Records[0].Battle_host,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true
        });
    }
    catch (error) {
        console.log("error in join Battle", error);

        return emitEvent(socket.id, "join_battle", error);

    }

}
async function challenge_user_for_battle(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: data.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.user_id ) {
        return emitEvent(socket.id, "challenge_user_for_battle", "Data is missing");
    }

    const already_battle = await getBattle({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_battle.Records.length <= 0) {
        return emitEvent(socket.id, "challenge_user_for_battle", {
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
    const live_host = await getBattle_host({ battle_id: already_battle.Records[0].battle_id, is_main_challenger: true, is_live: true })
    const main_streamer = await getUser({ user_id: live_host.Records[0].user_id })
    
    if (live_host?.Records?.length<1) {
        return emitEvent(socket.id, "challenge_user_for_battle", {
            is_user: false
        })
    }
    // for 
    
    // Have to create the new host with status and on joining have to update the status and have to consider that status while listing the hosts and battle it self

    const create_new_battle_host = await createBattleHost(
        {
            user_id: isUser.user_id,
            peer_id: "",
            battle_id: live_host.Records[0].battle_id,
            is_main_challenger: false,
            status:"requested"
        }
    )

    sendPushNotification(
        {
            playerIds: [isUser.device_token],
            title: `${main_streamer.full_name} has chhallenged you for the battle, check now`,
            message: `${main_streamer.full_name} has started a Battle, check now`,
            large_icon: main_streamer.profile_pic,
            data: {
                type: "battle_challenge",
                user_id: main_streamer.user_id,
                peer_id: live_host.Records[0].peer_id,
                battle_id: live_host.Records[0].battle_id,
                is_main_challenger: true
            }

        }
    )
    return emitEvent(isUser.socket_id, 'challenge_user_for_battle',
        {
            message: "Do you want to battle with me ??",
            User: {
                user_id: main_streamer.user_id,
                full_name: main_streamer.full_name,
                first_name: main_streamer.first_name,
                last_name: main_streamer.last_name,
                user_name: main_streamer.user_name,
                profile_pic: main_streamer.profile_pic,
                peer_id: live_host.Records[0].peer_id
            },
            // peer_id: already_live.Records[0].peer_id,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true

        }
    )
}
async function join_as_challenged_user(socket, data, emitEvent, joinRoom, emitToRoom, io) {
    try {


        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.battle_id  && !data.peer_id && !data.new_host_peer_id) {
            return emitEvent(socket.id, "join_as_challenged_user", "Data is missing");
        }

        const already_live = await getBattle({ battle_id: data.battle_id, live_status: "live" });

        if (already_live?.Records?.length <= 0) {
            return emitEvent(socket.id, "join_as_challenged_user", {
                is_live: false,
            });
        }
        
        const connect_new_host = await updateBattleHost(
            {

                user_id: isUser.user_id,
                battle_id: data.battle_id
            },
            {
                peer_id: data.new_host_peer_id,
                status: "joined",

            }
        )
        if (
            connect_new_host
        ) {
  
            joinRoom(socket, already_live?.Records[0].socket_room_id);
            emitToRoom(data.socket_room_id, "activity_on_live", {
                message: "New Host Joined",
                User: {
                    user_id: isUser.user_id,
                    full_name: isUser.full_name,
                    first_name: isUser.first_name,
                    last_name: isUser.last_name,
                    user_name: isUser.user_name,
                    profile_pic: isUser.profile_pic,
                    peer_id: data.new_host_peer_id
                },
            })

        }
        else {
            return emitEvent(socket.id, "join_as_challenged_user", "Failed to add new host");
        }
    } catch (error) {
        console.log("error in accept_request_for_new_host", error);

        return emitEvent(socket.id, "join_as_challenged_user", error);
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


async function leave_battle(socket, data, emitEvent, leaveRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    console.log("data in leave battle", data);


    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "leave_battle", "Data is missing");
    }
    const already_battle = await getBattle({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_battle.Records.length <= 0) {
        return emitEvent(socket.id, "leave_battle", "You Already left");
    }
    if (already_battle.Records[0].curent_viewers >= 0) {
        const update_live = await updateBattle(
            {
                socket_room_id: data.socket_room_id,
                battle_id: already_battle.Records[0].battle_id
            },
            {
                curent_viewers: already_battle.Records[0].curent_viewers - 1
            }
        );
    }


    emitToRoom(data.socket_room_id, "leave_battle", {
        total_viewers: already_battle.Records[0].total_viewers,
        curent_viewers: already_battle.Records[0].curent_viewers - 1,
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
    leaveRoom(socket, data.socket_room_id);

}




async function activity_on_battle(socket, data, emitEvent, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.like && !data.comment) {
        return emitEvent(socket.id, "activity_on_battle", "Data is missing");
    }
    const already_battle = await getBattle({ socket_room_id: data.socket_room_id, live_status: "live" });
    let real_time_payload
    if (already_battle.Records.length <= 0) {
        return emitEvent(socket.id, "activity_on_battle", "Live is closed");
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
            current_like: already_battle.Records[0].likes + 1,
            total_comments: already_battle.Records[0].comments
        }
        const update_live = await updateBattle(
            {
                socket_room_id: data.socket_room_id,
                battle_id: already_battle.Records[0].battle_id
            },
            {
                likes: already_battle.Records[0].likes + 1
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
            total_like: already_battle.Records[0].like,
            total_comments: already_battle.Records[0].comments + 1
        }
        const update_live = await updateBattle(
            {
                socket_room_id: data.socket_room_id,
                battle_id: already_battle.Records[0].battle_id
            },
            {
                comments: already_battle.Records[0].comments + 1
            }
        );
    }
    emitToRoom(data.socket_room_id, "activity_on_battle", real_time_payload)
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


module.exports = {
    start_battle,
    join_battle,
    get_live,
    leave_battle,
    activity_on_battle,
    get_live_admin,
    challenge_user_for_battle,
    join_as_challenged_user,
    leave_live_as_host
};
