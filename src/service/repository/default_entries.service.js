const db = require("../../../models");
const {
    Admin,
    Avatar,
    Follow,
    Gift_category,
    Gift,
    Language_translation,
    Language,
    Music,
    Project_conf,
    Report_type,
    Transaction_conf,
    Transaction_plan,
    User,
    Chat,
    Coin_to_coin,
    Comment,
    Hashtag,
    Like,
    Media,
    Message_seen,
    Message,
    Money_coin_transaction,
    Notification,
    Participant,
    sequelize,
    Social
} = require("../../../models");
const { getAdmin } = require("./Admin.service");
const { getAvatars, createAvatar } = require("./Avatar.service");
const { createChat } = require("./Chat.service");
const { createLive, generateRoomId, getLive } = require("./Live.service");
const { getLiveLive_host, createLiveHost } = require("./Live_host.service");
const { createMedia } = require("./Media.service");
const { getMessage, createMessage } = require("./Message.service");
const { createMessageSeen } = require("./Message_seen.service");
const { getParticipantWithoutPagenation, alreadyParticipantIndividual, createParticipant } = require("./Participant.service");
const { getConfig, createConfig } = require("./Project_conf.service");
const { createSocial } = require("./SocialMedia.service");
const { gettransaction_conf, create_transaction_conf } = require("./Transactions/transaction_conf.service");
const { getUser, createUser } = require("./user.service");
const cron = require('node-cron');
const { Op, Sequelize, where } = require('sequelize');


const MODELS_TO_SKIP = [
    'Admin',
    'Avatar',
    'Follow',
    'Gift_category',
    'Gift',
    'Language_translation',
    'Language',
    'Music',
    'Project_conf',
    'Report_type',
    'Transaction_conf',
    'Transaction_plan',
    'User',

]; // Keep all entries of these models

// Configure models and time-based deletion
const PARTIAL_CLEANUP = {

    Chat: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T01:29:35.441Z'),
        excludeConditions: {},

    },
    Coin_to_coin: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Comment: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Hashtag: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Like: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Media: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Social: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Live: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Live_host: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Message_seen: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Message: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},

    },
    Money_coin_transaction: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},
    },
    Notification: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},
    },
    Participant: {
        field: 'createdAt',
        afterTime: new Date('2025-07-12T06:29:35.441Z'),
        excludeConditions: {},
    },
};

const PARTIAL_UPDATE = [
    {
        model: 'User',
        field: 'createdAt',
        afterTime: new Date('2025-08-13T07:59:00.000Z'),
        excludeConditions: {},
        updateField: 'total_socials',
        updateValue: 0
    }
];

async function default_entries() {

    try {
        const project_config_data = {
            phone_authentication: true,
            email_authentication: true,
            maximum_members_in_group: 10,
            show_all_contatcts: true,
            show_phone_contatcs: false,
            app_logo_light: "app_logo_light",
            app_logo_dark: "app_logo_dark",
            splash_image: "splash_image",
            one_signal_app_id: "one_signal_app_id",
            one_signal_api_key: "one_signal_api_key",
            app_name: "app_name",
            app_email: "app_email",
            app_text: "app_text",
            app_primary_color: "app_primary_color",
            app_secondary_color: "app_secondary_color",
            app_ios_link: "app_ios_link",
            app_android_link: "app_android_link",
            app_tell_a_friend_text: "app_tell_a_friend_text",
            web_logo_light: "web_logo_light",
            web_logo_dark: "web_logo_dark",
            twilio_account_sid: "twilio_account_sid",
            twilio_auth_token: "twilio_auth_token",
            twilio_phone_number: "twilio_phone_number",
            msg_91_auth_key: "msg_91_auth_key",
            msg_91_private_key: "msg_91_private_key",
            email_service: "email_service",
            smtp_host: "smtp_host",
            email: "email",
            password: "password",
            email_title: "email_title",
            email_port: "email_port",
            copyright_text: "copyright_text",
            privacy_policy: "privacy_policy",
            terms_and_conditions: "terms_and_conditions",
            purchase_code: "purchase_code",
        }

        const config = await getConfig({ config_id: 1 });

        if (!config) {


            await createConfig(project_config_data);
        }


        // avatar default Values 
        const avatar_data = await getAvatars()

        if (avatar_data.Pagination.total_records < 9) {
            for (let index = 0; index < 5; index++) {
                data = {
                    name: `male-avatar-${index + 1}`,
                    avatar_media: `uploads/avatar/male-avatar-${index + 1}.png`,
                    avatar_gender: "male",
                }
                await createAvatar(data)

            }
            for (let index = 0; index < 4; index++) {
                data = {
                    name: `female-avatar-${index + 1}`,
                    avatar_media: `uploads/avatar/female-avatar-${index + 1}.png`,
                    avatar_gender: "female",

                }
                await createAvatar(data)

            }
        }

        // Admin- default values
        const admin_data = {
            full_name: "ReelBoost Admin",
            first_name: "ReelBoost",
            last_name: "Admin",
            email: "demo@reelboost.com",
            password: "Admin@123",
            gender: "male",
            country: "INDIA",
            country_short_name: "IN"
        }

        const is_admin = await getAdmin({ admin_id: 1 });

        if (!is_admin) {
            const new_admin = Admin.create(admin_data)
        }


        // Transaction_conf 
        const transaction_conf_data = {
            tax: 25,
            admin_margin: 25,
            currency: "INR",
            coin_value_per_1_currency: 1,
            transaction_type: "withdrawal",
            status: true
        }
        const transaction_conf = await gettransaction_conf({
            transaction_conf_id: 1,

        })
        if (transaction_conf.Pagination.total_records <= 0) {
            const new_transaction_conf = create_transaction_conf(
                transaction_conf_data
            )
        }
        // Keywords 
    } catch (error) {
        console.log(error);
    }
}

async function updateTotalSocialsForAllUsers() {
    try {
        // Step 1: Count socials for all users
        const socialCounts = await db.Social.findAll({
            attributes: [
                'user_id',
                [Sequelize.fn('COUNT', Sequelize.col('social_id')), 'socialCount']
            ],
            where:{
                deleted_by_user: false
            },
            group: ['user_id'],
            raw: true
        });

        // Step 2: Update users with their actual count
        for (const { user_id, socialCount } of socialCounts) {
            await db.User.update(
                { total_socials: socialCount },
                { where: { user_id } }
            );
        }

        // Step 3: Set total_socials = 0 for users with no socials
        await db.User.update(
            { total_socials: 0 },
            {
                where: {
                    user_id: {
                        [Op.notIn]: socialCounts.map(sc => sc.user_id)
                    }
                }
            }
        );

        console.log(`✅ Finished updating total_socials for all users`);
    } catch (err) {
        console.error("❌ Error updating total_socials:", err);
    }
}
async function demo_entries() {

    try {
        // Demo Live
        if (process?.env?.DEMO_LIVE == 'true') {


            // Dummy user data start
            const dummy_user_data1 = {
                full_name: "Williams Welsh",
                first_name: "Williams",
                last_name: "Welsh",
                user_name: "williams654",
                email: "dummy1@dummy.com",
                country_code: "+91",
                mobile_num: "1234567891",
                login_type: "email",
                gender: "Male",
                country: "India",
                profile_pic: "uploads/avatar/male-avatar-1.png",
                country_short_name: "IN",
                bio: "This is a demo user1",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            const dummy_user_data2 = {
                full_name: "James Deep",
                first_name: "James",
                last_name: "Deep",
                user_name: "james55",
                email: "dummy2@dummy.com",
                country_code: "+91",
                mobile_num: "1234567892",
                login_type: "email",
                gender: "Male",
                country: "India",
                profile_pic: "uploads/avatar/male-avatar-2.png",
                country_short_name: "IN",
                bio: "This is a demo user2",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            const dummy_user_data3 = {
                full_name: "George Swif",
                first_name: "George",
                last_name: "Swif",
                user_name: "george43",
                email: "dummy3@dummy.com",
                country_code: "+91",
                mobile_num: "1234567893",
                login_type: "email",
                gender: "Male",
                country: "India",
                profile_pic: "uploads/avatar/male-avatar-4.png",
                country_short_name: "IN",
                bio: "This is a demo user3",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            const dummy_user_data4 = {
                full_name: "Thomas Martin",
                first_name: "Thomas",
                last_name: "Martin",
                user_name: "thomas1871",
                email: "dummy4@dummy.com",
                country_code: "+91",
                mobile_num: "1234567894",
                login_type: "email",
                gender: "Male",
                country: "India",
                profile_pic: "uploads/avatar/male-avatar-5.png",
                country_short_name: "IN",
                bio: "This is a demo user4",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            const dummy_user_data5 = {
                full_name: "Martha Beth",
                first_name: "Martha",
                last_name: "Beth",
                user_name: "martha34",
                email: "dummy5@dummy.com",
                country_code: "+91",
                mobile_num: "1234567895",
                login_type: "email",
                gender: "Female",
                country: "India",
                profile_pic: "uploads/avatar/female-avatar-3.png",
                country_short_name: "IN",
                bio: "This is a demo user5",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            const dummy_user_data6 = {
                full_name: "Jane Williams",
                first_name: "Jane",
                last_name: "Williams",
                user_name: "jane00",
                email: "dummy6@dummy.com",
                country_code: "+91",
                mobile_num: "1234567896",
                login_type: "email",
                gender: "Female",
                profile_pic: "uploads/avatar/female-avatar-1.png",
                country: "India",
                country_short_name: "IN",
                bio: "This is a demo user6",
                profile_verification_status: true,
                login_verification_status: true,
                available_coins: 1000,
            }
            let is_dummy_user1 = await getUser({ user_name: dummy_user_data1.user_name });
            let is_dummy_user2 = await getUser({ user_name: dummy_user_data2.user_name });
            let is_dummy_user3 = await getUser({ user_name: dummy_user_data3.user_name });
            let is_dummy_user4 = await getUser({ user_name: dummy_user_data4.user_name });
            let is_dummy_user5 = await getUser({ user_name: dummy_user_data5.user_name });
            let is_dummy_user6 = await getUser({ user_name: dummy_user_data6.user_name });

            if (!is_dummy_user1) {
                is_dummy_user1 = await createUser(dummy_user_data1);
            }
            if (!is_dummy_user2) {
                is_dummy_user2 = await createUser(dummy_user_data2);
            }
            if (!is_dummy_user3) {
                is_dummy_user3 = await createUser(dummy_user_data3);
            }
            if (!is_dummy_user4) {
                is_dummy_user4 = await createUser(dummy_user_data4);
            }
            if (!is_dummy_user5) {
                is_dummy_user5 = await createUser(dummy_user_data5);
            }
            if (!is_dummy_user6) {
                is_dummy_user6 = await createUser(dummy_user_data6);
            }
            // Dummy user data false

            // Live Dummy Entry start
            let room_id = generateRoomId();
            const is_dummy_user1_live = await getLiveLive_host({ user_id: is_dummy_user1.user_id });
            const is_dummy_user2_live = await getLiveLive_host({ user_id: is_dummy_user2.user_id });
            const is_dummy_user3_live = await getLiveLive_host({ user_id: is_dummy_user3.user_id });
            const is_dummy_user4_live = await getLiveLive_host({ user_id: is_dummy_user4.user_id });
            const is_dummy_user5_live = await getLiveLive_host({ user_id: is_dummy_user5.user_id });
            const is_dummy_user6_live = await getLiveLive_host({ user_id: is_dummy_user6.user_id });

            // live 1
            const dummy_user_live_data1 = {
                live_title: "Demo Live 1",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true
            }
            let dummy_user_live_host_data1 = {
                user_id: is_dummy_user1.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/0179fce2-7c45-4aac-87ed-f749de5a6ccd/master.m3u8",

            }

            // live 2
            room_id = generateRoomId();

            const dummy_user_live_data2 = {
                live_title: "Demo Live 2",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true

            }

            let dummy_user_live_host_data2 = {
                user_id: is_dummy_user2.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/09233724-4fe1-4662-b094-437762c4374e/master.m3u8",

            }

            // live 3
            room_id = generateRoomId();

            const dummy_user_live_data3 = {
                live_title: "Demo Live 3",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true

            }
            let dummy_user_live_host_data3 = {
                user_id: is_dummy_user3.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/6a7c0d81-f405-4538-8512-a049170146b7/master.m3u8",

            }

            // live 4 

            room_id = generateRoomId();

            const dummy_user_live_data4 = {
                live_title: "Demo Live 4",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true

            }
            let dummy_user_live_host_data4 = {
                user_id: is_dummy_user4.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/9bbc8be9-3818-43b5-8959-02c9ce1408d9/master.m3u8",

            }

            // live 5
            room_id = generateRoomId();

            const dummy_user_live_data5 = {
                live_title: "Demo Live 5",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true

            }
            let dummy_user_live_host_data5 = {
                user_id: is_dummy_user5.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/dabfc264-d414-43e9-b51e-ece730acc7de/master.m3u8",

            }

            // live 6
            room_id = generateRoomId();

            const dummy_user_live_data6 = {
                live_title: "Demo Live 6",
                socket_room_id: room_id,
                live_status: "live",
                is_demo: true

            }
            let dummy_user_live_host_data6 = {
                user_id: is_dummy_user6.user_id,
                is_main_host: true,
                peer_id: "https://snapta.s3.us-east-2.amazonaws.com/dummy-live-stream/dabfc264-d414-43e9-b51e-ece730acc7de/master.m3u8",

            }


            if (is_dummy_user1_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data1);
                dummy_user_live_host_data1.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data1
                )
            }


            if (is_dummy_user2_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data2);
                dummy_user_live_host_data2.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data2
                )
            }
            if (is_dummy_user3_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data3);
                dummy_user_live_host_data3.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data3
                )
            }
            if (is_dummy_user4_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data4);
                dummy_user_live_host_data4.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data4
                )
            }
            if (is_dummy_user5_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data5);
                dummy_user_live_host_data5.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data5
                )
            }
            if (is_dummy_user6_live.Pagination.total_records < 1) {
                const live = await createLive(dummy_user_live_data6);
                dummy_user_live_host_data6.live_id = live.live_id
                await createLiveHost(
                    dummy_user_live_host_data6
                )
            }

        }
        if (process?.env?.DELETE_BY_CRON == 'true') {
            const now = new Date();
            const nextRun = new Date(now);
            nextRun.setHours(2, 0, 0, 0);

            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }

            const hoursLeft = ((nextRun - now) / (1000 * 60 * 60)).toFixed(2);
            console.log(`[CRON] Hours left until next 2:00 AM run: ${hoursLeft} hours`);

            // console.log(`[CRON] Running database cleanup at ${new Date().toISOString()}`);
            cron.schedule('0 2 * * *', async () => {
            // cron.schedule('*/10 * * * *', async () => {
                console.log('[CRON] Starting scheduled database cleanup at 2:00 AM...');
                try {
                    const allModels = sequelize.models;

                    for (const modelName in allModels) {
                        if (MODELS_TO_SKIP.includes(modelName)) {
                            console.log(`[SKIP] Skipping model: ${modelName}`);
                            continue;
                        }

                        const model = allModels[modelName];

                        if (PARTIAL_CLEANUP[modelName]) {
                            const { field, afterTime, excludeConditions } = PARTIAL_CLEANUP[modelName];

                            const where = {
                                [field]: {
                                    [Op.gt]: afterTime, // DELETE records created AFTER this time
                                },
                                ...excludeConditions, // Apply additional exclusions if any
                            };

                            const deleted = await model.destroy({ where });
                            console.log(`[DELETE-PARTIAL] ${modelName}: Deleted ${deleted} recent entries`);
                        
                        } else {
                            const deleted = await model.destroy({ where: {} });
                            console.log(`[DELETE-ALL] ${modelName}: Deleted ${deleted} entries`);
                        }
                    }
                    
                    updateTotalSocialsForAllUsers()

                    console.log(`[CRON] Database cleanup finished.`);
                } catch (err) {
                    console.error(`[ERROR] Cleanup failed:`, err);
                }
            });

        }
        // Chat Dummy Entries
        // if (process?.env?.DEMO_CHATS == 'true') {
        //     const dummy_chat_user_1 = {
        //         full_name: "Demo User1",
        //         first_name: "Demo",
        //         last_name: "User1",
        //         user_name: "demo_1",
        //         email: "demo1@demo.com",
        //         country_code: "+91",
        //         mobile_num: "0987654321",
        //         login_type: "email",
        //         gender: "Male",
        //         country: "India",
        //         profile_pic: "uploads/avatar/male-avatar-1.png",
        //         country_short_name: "IN",
        //         bio: "This is a demo user1",
        //         profile_verification_status: true,
        //         login_verification_status: true,
        //         available_coins: 1000,
        //     }
        //     const dummy_chat_user_2 = {
        //         full_name: "Demo User2",
        //         first_name: "Demo",
        //         last_name: "User2",
        //         user_name: "demo_2",
        //         email: "demo2@demo.com",
        //         country_code: "+91",
        //         mobile_num: "0987654322",
        //         login_type: "email",
        //         gender: "Male",
        //         country: "India",
        //         profile_pic: "uploads/avatar/male-avatar-2.png",
        //         country_short_name: "IN",
        //         bio: "This is a demo user2",
        //         profile_verification_status: true,
        //         login_verification_status: true,
        //         available_coins: 1000,
        //     }
        //     const dummy_chat_user_3 = {
        //         full_name: "Demo User3",
        //         first_name: "Demo",
        //         last_name: "User3",
        //         user_name: "demo_3",
        //         email: "demo3@demo.com",
        //         country_code: "+91",
        //         mobile_num: "0987654323",
        //         login_type: "email",
        //         gender: "Male",
        //         country: "India",
        //         profile_pic: "uploads/avatar/male-avatar-3.png",
        //         country_short_name: "IN",
        //         bio: "This is a demo user2",
        //         profile_verification_status: true,
        //         login_verification_status: true,
        //         available_coins: 1000,
        //     }
        //     const dummy_chat_user_4 = {
        //         full_name: "Demo User4",
        //         first_name: "Demo",
        //         last_name: "User4",
        //         user_name: "demo_4",
        //         email: "demo4@demo.com",
        //         country_code: "+91",
        //         mobile_num: "0987654324",
        //         login_type: "email",
        //         gender: "Female",
        //         country: "India",
        //         profile_pic: "uploads/avatar/female-avatar-4.png",
        //         country_short_name: "IN",
        //         bio: "This is a demo user3",
        //         profile_verification_status: true,
        //         login_verification_status: true,
        //         available_coins: 1000,
        //     }

        //     let is_dummy_chat_user_1 = await getUser({ user_name: dummy_chat_user_1.user_name });

        //     if (!is_dummy_chat_user_1) {
        //         is_dummy_chat_user_1 = await createUser(dummy_chat_user_1);
        //     }
        //     let is_dummy_chat_user_2 = await getUser({ user_name: dummy_chat_user_2.user_name });

        //     if (!is_dummy_chat_user_2) {
        //         is_dummy_chat_user_2 = await createUser(dummy_chat_user_2);
        //     }
        //     let is_dummy_chat_user_3 = await getUser({ user_name: dummy_chat_user_3.user_name });

        //     if (!is_dummy_chat_user_3) {
        //         is_dummy_chat_user_3 = await createUser(dummy_chat_user_3);
        //     }
        //     let is_dummy_chat_user_4 = await getUser({ user_name: dummy_chat_user_4.user_name });

        //     if (!is_dummy_chat_user_4) {
        //         is_dummy_chat_user_4 = await createUser(dummy_chat_user_4);
        //     }

        //     // Check Participants
        //     // const user_1_participants = await getParticipantWithoutPagenation({
        //     //     user_id: is_dummy_chat_user_1.user_id
        //     // })
        //     // const user_2_participants = await getParticipantWithoutPagenation({
        //     //     user_id: is_dummy_chat_user_2.user_id
        //     // })

        //     const participants_1_2 = await alreadyParticipantIndividual(
        //         {
        //             user_id: is_dummy_chat_user_1.user_id,
        //             user_id: is_dummy_chat_user_2.user_id
        //         }
        //     )
        //     if (!participants_1_2) {
        //         const newChat = await createChat({
        //             chat_type: "Private",
        //         });
        //         await createParticipant({
        //             user_id: is_dummy_chat_user_1.user_id,
        //             chat_id: newChat.chat_id,
        //         });
        //         await createParticipant({
        //             user_id: is_dummy_chat_user_2.user_id,
        //             chat_id: newChat.chat_id,
        //         });

        //         // Create Social 

        //         const new_social = await createSocial({
        //             social_desc:""
        //         })
        //         const new_media = await createMedia(

        //         )
        //         const user_1_sender_for_text_1 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "Good morning, 🌞",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_1_sender_for_text_1.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_1.user_id
        //             }
        //         )
        //         const user_1_sender_for_text_2 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "You won’t believe the sunrise I saw today!",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_1_sender_for_text_2.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_1.user_id
        //             }
        //         )
        //         const user_1_sender_for_image_1 = await createMessage(

        //             {
        //                 message_type: 'image',
        //                 message_content: "https://snapta.s3.us-east-2.amazonaws.com/dummy-chat-media-reelboost/sunrise.png",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_1_sender_for_image_1.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_1.user_id
        //             }
        //         )


        //         const user_2_sender_for_text_1 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "Whoa! That’s beautiful. Where is this?",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_2.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_2_sender_for_text_1.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_2.user_id
        //             }
        //         )
        //         const user_1_sender_for_text_3 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "I clicked it during my morning hike at Tiger Hill. It was magical 🌄",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_1_sender_for_text_3.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_1.user_id
        //             }
        //         )
        //         const user_2_sender_for_text_2 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "I wish I had that kind of morning motivation 😅",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_2.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_2_sender_for_text_2.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_2.user_id
        //             }
        //         )
        //         const user_2_sender_for_gif_1 = await createMessage(

        //             {
        //                 message_type: 'gif',
        //                 message_content: "https://snapta.s3.us-east-2.amazonaws.com/dummy-chat-media-reelboost/c62816c99a057aa20917a0749a574efa.gif",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_2.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_2_sender_for_gif_1.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_2.user_id
        //             }
        //         )
        //         const user_1_sender_for_text_4 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "Haha 😂 That’s totally you in the morning.",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_1_sender_for_text_4.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_1.user_id
        //             }
        //         )
        //         const user_2_sender_for_text_3 = await createMessage(

        //             {
        //                 message_type: 'text',
        //                 message_content: "Btw, saw this reel yesterday and thought of you. You’re gonna love it!.",
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }

        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_2_sender_for_text_3.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_2.user_id
        //             }
        //         )
        //         const user_2_sender_for_reel_1 = await createMessage(
        //             {
        //                 message_type: 'social',
        //                 social_id: new_social.social_id, //Reel of dense Forest
        //                 chat_id: newChat.chat_id,
        //                 sender_id: is_dummy_chat_user_1.user_id
        //             }
        //         )
        //         await createMessageSeen(
        //             {
        //                 message_seen_status: "seen",
        //                 message_id: user_2_sender_for_reel_1.message_id,
        //                 chat_id: newChat.chat_id,
        //                 user_id: is_dummy_chat_user_2.user_id
        //             }
        //         )

        //     }
        //     // Check messages of user 


        //     const user_2_sender_for_reel_1 = await getMessage(
        //         {
        //             message_type: 'social',
        //             social_id: 'social_id', //Reel of dense Forest
        //             sender_id: is_dummy_chat_user_2.user_id
        //         }
        //     )
        //     const user_1_sender_for_text_5 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "This is why we need a weekend getaway soon! Nature is calling 🍃",
        //             sender_id: is_dummy_chat_user_1.user_id
        //         }
        //     )
        //     const user_2_sender_for_text_4 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "Exactly. Also, I finally edited our old camping video. Wanna see it?",
        //             sender_id: is_dummy_chat_user_2.user_id
        //         }
        //     )
        //     const user_2_sender_for_video_1 = await getMessage(
        //         {
        //             message_type: 'video',
        //             message_thumbnail: '{thumbnail of camping}',
        //             message_content: "{video of camping}",
        //             sender_id: is_dummy_chat_user_2.user_id
        //         }
        //     )
        //     const user_1_sender_for_text_6 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "OMG the part where we tried to set up the tent and it collapsed — hilarious! 🤣",
        //             sender_id: is_dummy_chat_user_1.user_id
        //         }
        //     )
        //     const user_1_sender_for_text_7 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "Hey, can you also send that checklist doc you made for the next trip?",
        //             sender_id: is_dummy_chat_user_1.user_id
        //         }
        //     )
        //     const user_2_sender_for_doc_1 = await getMessage(
        //         {
        //             message_type: 'doc',
        //             message_content: "{trip checklist document}",
        //             sender_id: is_dummy_chat_user_2.user_id
        //         }
        //     )
        //     const user_1_sender_for_text_8 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "Got it! You’re the best planner I know ✨",
        //             sender_id: is_dummy_chat_user_1.user_id
        //         }
        //     )
        //     const user_1_sender_for_text_9 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "Let’s lock the dates soon!",
        //             sender_id: is_dummy_chat_user_1.user_id
        //         }
        //     )
        //     const user_2_sender_for_text_5 = await getMessage(
        //         {
        //             message_type: 'text',
        //             message_content: "Deal! This time, we pack snacks before reaching the hills 😅",
        //             sender_id: is_dummy_chat_user_2.user_id
        //         }
        //     )

        //     // Message Dummy Entries 

        // }


    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    default_entries,
    demo_entries
}