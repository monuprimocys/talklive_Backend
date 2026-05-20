
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { get_coin_value_from_money, gettransaction_conf, get_money_value_from_coin, updateTransactionConf } = require("../../service/repository/Transactions/transaction_conf.service");
const { updateUser, getUser } = require("../../service/repository/user.service");
const { createMoneyCoinTransaction, getMoneyCoinTransaction } = require("../../service/repository/Transactions/Money_coin_transaction.service");
const { getGift } = require("../../service/repository/Gift.service");
const { getSocial } = require("../../service/repository/SocialMedia.service");
const { createCoinToCoinTransaction, getCoinToCoinTransaction, getBattleTransactionHistory } = require("../../service/repository/Transactions/Coin_coin_transaction.service");
const { User, Gift, Transaction_plan } = require("../../../models");
const { BIGINT } = require("sequelize");
const { getTransactionPlan } = require("../../service/repository/Transactions/Transaction_plan.service");
const { createNotification } = require("../../service/repository/notification.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createStripeIntent } = require("../../service/common/stripe.service");
const socket_service = require("../../service/common/socket.service");
const { updateLiveHost, getLiveLive_host } = require("../../service/repository/Live_host.service");
const { getLive } = require("../../service/repository/Live.service");

// recharge
async function Money_to_coin(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'payment_method',
            'acutal_money',
            'success',
            'transaction_id_gateway',
            'plan_id'

        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
            filteredData.user_id = user_id
            filteredData.acutal_money = Number(filteredData.acutal_money)
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
        const is_user = await getUser({ user_id })
        if (is_user) {
            const transaction_plan = await getTransactionPlan({ plan_id: filteredData.plan_id })


            const coin_value_per_1_currency = await get_coin_value_from_money({ money: filteredData.acutal_money, plan_id: filteredData.plan_id });
            const newly_added_coins = transaction_plan.Records[0].toJSON();
            const current_coin = Number(is_user.toJSON().available_coins);
            const new_available_coin = Number(newly_added_coins.coins) + current_coin;
            // const new_available_coin = newly_added_coins + current_coin;

            // return



            // Appply transaction 

            if (filteredData.success == "success") {

                const update_user = await updateUser({ available_coins: Number(new_available_coin) }, { user_id: is_user.toJSON().user_id })
                if (updateUser.length > 0) {
                    const trasaction = await createMoneyCoinTransaction({
                        payment_method: filteredData.payment_method,
                        acutal_money: newly_added_coins.corresponding_money,
                        coin: Number(newly_added_coins.coins),
                        success: filteredData.success,
                        user_id: filteredData.user_id,
                        transaction_type: "recharge",
                        // coin_price: Number(newly_added_coins.coin_value_per_1_currency),
                        coin_price: Math.floor(Number(coin_value_per_1_currency.coin_value_per_1_currency) * 100),
                        past_coin: current_coin,
                        new_available_coin: new_available_coin,
                        currency: transaction_plan.Records[0].currency,
                        transaction_id_gateway: filteredData.transaction_id_gateway.Coin_to_Coin,
                        plan_id: filteredData.plan_id
                    })
                    if (trasaction) {

                        sendPushNotification(
                            {
                                playerIds: [req.userData.device_token],
                                title: "Recharge",
                                message: `You recharge for ${newly_added_coins.coins} is successfully added to your account `,
                                data: {
                                    type: "recharge",
                                    trasaction_id: trasaction.transaction_id
                                }
                            }
                        )
                        return generalResponse(
                            res,
                            {},
                            `Transaction Successfull ${newly_added_coins.coins} added in your Reel Boost Account`,
                            true,
                            true
                        );
                    }
                    return generalResponse(
                        res,
                        {},
                        `Transaction Failed`,
                        true,
                        true
                    );
                }
                else {
                    const trasaction = await createMoneyCoinTransaction({
                        payment_method: filteredData.payment_method,
                        // acutal_money: filteredData.acutal_money,
                        acutal_money: newly_added_coins.corresponding_money,
                        coin: newly_added_coins.coins,
                        user_id: filteredData.user_id,
                        success: "Not Reflected in Profile",
                        transaction_type: "recharge",
                        // coin_price: newly_added_coins.coin_value_per_1_currency,
                        coin_price: Number(coin_value_per_1_currency.coin_value_per_1_currency),

                        past_coin: current_coin,
                        new_available_coin: new_available_coin,
                        currency: transaction_plan.Records[0].currency,
                        transaction_id_gateway: filteredData.transaction_id_gateway,
                        plan_id: filteredData.plan_id

                    })
                    return generalResponse(
                        res,
                        {},
                        `We received your request the coins will be reflected in you profile after verification`,
                        false,
                        true
                    );
                }
            }
            return generalResponse(
                res,
                {},
                `We received your request the coins may be reflected in you profile after verification`,
                false,
                true
            );
            // update user-Coin

        }
        else {
            return generalResponse(
                res,
                { success: false },
                "User Not found !",
                false,
                true,
                404
            );
        }
    } catch (error) {
        console.error("Error in recharge", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Recharging !",
            false,
            true
        );
    }
}
async function Transaction_history(req, res) {
    try {

        const user_id = req.authData.user_id

        const allowedUpdateFields = [
            'transaction_id',
            'success',
            'transaction_id_gateway',
            'transaction_type',
            'transaction_table',
            'transaction_ref',
            'sender_id',
            'reciever_id',
            'gift_id',
            'social_id',
            'all',
            'start_date',
            'end_date',
        ]

        const allowedUpdateFields_for_Money = [
            'transaction_id',
            'success',
            'transaction_id_gateway',
            'transaction_type',
            'user_id',
            'start_date',
            'end_date',
        ]
        const allowedUpdateFields_for_Coin = [
            'transaction_id',
            'success',
            'sender_id',
            'reciever_id',
            'gift_id',
            'social_id',
            'transaction_ref',
            'all',
            'start_date',
            'end_date',
        ]
        let filteredData
        let updatedData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);

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
        const is_user = await getUser({ user_id })

        const { page = 1, pageSize = 10 } = req.body

        if (!is_user) {
            return generalResponse(
                res,
                { success: false },
                "User Not found !",
                false,
                true,
                404
            )
        }

        if (filteredData?.transaction_table !== "coin" && filteredData?.transaction_table !== "money") {
            return generalResponse(
                res,
                { success: false },
                "Invalid Transaction Table",
                false,
                true,
                501
            );
        }

        if (filteredData?.transaction_table === "coin") {

            if (!is_user.is_admin && !filteredData.sender_id && !filteredData.reciever_id) {
                return generalResponse(
                    res,
                    { success: false },
                    "Sender or Reciever is Missing",
                    false,
                    true,
                    501
                )
            }

            if (!req.body.profile_data) {


                if (!is_user.is_admin && !filteredData.sender_id) {
                    if (filteredData.reciever_id != user_id) {

                        return generalResponse(
                            res,
                            { success: false },
                            "unAuthorized",
                            false,
                            true,
                            403
                        )
                    }
                }
            }
            if (!is_user.is_admin && !filteredData.reciever_id) {
                if (filteredData.sender_id != user_id) {

                    return generalResponse(
                        res,
                        { success: false },
                        "unAuthorized",
                        false,
                        true,
                        403
                    )
                }
            }
            if (!is_user.is_admin && filteredData.sender_id && filteredData.reciever_id) {

                let allow_action = false
                if (filteredData.sender_id == user_id) {

                    allow_action = true
                }
                if (filteredData.reciever_id == user_id) {
                    allow_action = true
                }
                if (!allow_action) {

                    return generalResponse(
                        res,
                        { success: false },
                        "unAuthorized",
                        false,
                        true,
                        403
                    )
                }
            }
        }
        if (filteredData?.transaction_table === "money") {
            updatedData = Object.fromEntries(
                Object.entries(filteredData).filter(([key]) =>
                    allowedUpdateFields_for_Money.includes(key)
                )
            );
            if (!is_user.is_admin) {

                updatedData.user_id = user_id
            }
            else {
                updatedData.user_id = req.body.user_id

            }
        }
        if (filteredData?.transaction_table === "coin") {
            updatedData = Object.fromEntries(
                Object.entries(filteredData).filter(([key]) =>
                    allowedUpdateFields_for_Coin.includes(key)
                )
            );
        }


        const user_Data = is_user.toJSON()
        let transactions
        const includeOptions = [
            {
                model: User,
                as: 'sender',
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
            },
            {
                model: User,
                as: 'reciever',
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
            },
            {
                model: Gift,
            },

        ]  //
        const includeOptions_for_money = [
            {
                model: User,
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
            },



        ]  //
        if (filteredData.transaction_table == "coin") {
            if (req.body.profile_data) {

                transactions = await getCoinToCoinTransaction(updatedData, { page, pageSize }, [], includeOptions, true)
            }
            else {

                transactions = await getCoinToCoinTransaction(updatedData, { page, pageSize }, [], includeOptions)
            }
        }


        if (filteredData.transaction_table == "money") {

            transactions = await getMoneyCoinTransaction(updatedData, { page, pageSize }, [], includeOptions_for_money)

        }
        if (transactions.Records.length > 0) {
            return generalResponse(
                res,
                transactions,
                `Transaction history`,
                true,
                true
            );
        }
        else {
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
                `No Transaction Found`,
                true,
                true
            );
        }
    } catch (error) {
        console.error("Error in Getting Transaction history", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong Getting Transaction history !",
            false,
            true
        );
    }
}


// withdraw
async function Coin_to_Money(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'coins',
            'payment_method',
            'transaction_email'
        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
            filteredData.user_id = user_id
            filteredData.success = "pending"
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
        const is_user = await getUser({ user_id })
        if (is_user) {
            // Check Bank details
            const userData = is_user.toJSON();



            if (filteredData.payment_method == "bank" &&
                (!userData.account_name || userData.account_name.length === 0 ||
                    !userData.account_number || userData.account_number.length === 0 ||
                    !userData.bank_name || userData.bank_name.length === 0 ||
                    !userData.IFSC_code || userData.IFSC_code.length === 0 ||
                    !userData.swift_code || userData.swift_code.length === 0)
            ) {
                return generalResponse(
                    res,
                    { success: false },
                    "Bank Details are Missing",
                    false,
                    true,
                    501
                );
            }
            const withdrawal_conf = await gettransaction_conf({ transaction_type: "withdrawal" });
            const current_coin = Number(is_user.toJSON().available_coins);
            if (filteredData.coins > current_coin) {
                return generalResponse(
                    res,
                    { success: false },
                    "Insufficient Coins",
                    true,
                    true,

                );
            }
            if (filteredData.coins < withdrawal_conf.Records[0].minimum_transaction) {
                return generalResponse(
                    res,
                    { success: false },
                    "Minimum Withdrawal Amount is " + withdrawal_conf.Records[0].minimum_transaction,
                    false,
                    true,
                    501
                );
            }
            const equelent_money = Number(await get_money_value_from_coin({ Coins: filteredData.coins }));

            const new_available_coin = current_coin - filteredData.coins;



            // Appply transaction 


            const update_user = await updateUser({ available_coins: Number(new_available_coin) }, { user_id: is_user.toJSON().user_id })
            if (update_user.length > 0) {
                const trasaction = await createMoneyCoinTransaction({
                    payment_method: filteredData.payment_method,
                    acutal_money: equelent_money,
                    coin: filteredData.coins,
                    success: filteredData.success,
                    transaction_type: "withdrawal",
                    coin_price: withdrawal_conf.Records[0].coin_value_per_1_currency,
                    past_coin: current_coin,
                    new_available_coin: new_available_coin,
                    currency: withdrawal_conf.Records[0].currency,
                    transaction_id_gateway: "",
                    user_id: filteredData.user_id
                })
                if (trasaction) {
                    sendPushNotification(
                        {
                            playerIds: [req.userData.device_token],
                            title: "Withdrawal request",
                            message: `Your withdrawl request of ${equelent_money} ${withdrawal_conf.Records[0].currency}`,
                            data: {
                                type: "withdrawal_request",
                                trasaction_id: trasaction.transaction_id

                            }
                        }
                    )
                    return generalResponse(
                        res,
                        {},
                        `Your request of withdrawal of ${filteredData.coins} coins has been recived and will be processed soon`,
                        true,
                        true
                    );
                }
                return generalResponse(
                    res,
                    {},
                    `Transaction Failed`,
                    true,
                    true
                );
            }
            else {
                const trasaction = await createMoneyCoinTransaction({
                    payment_method: "",
                    acutal_money: equelent_money,
                    coin: filteredData.coins,
                    success: "Not Reflected in Profile",
                    transaction_type: "withdrawal",
                    coin_price: withdrawal_conf.Records[0].coin_value_per_1_currency,
                    past_coin: current_coin,
                    new_available_coin: new_available_coin,
                    currency: withdrawal_conf.Records[0].currency,
                    transaction_id_gateway: "",
                    user_id: filteredData.user_id

                })
                return generalResponse(
                    res,
                    {},
                    `We received your request the coins will be reflected in you profile after verification`,
                    false,
                    true
                );
            }

            // update user-Coin

        }
        else {
            return generalResponse(
                res,
                { success: false },
                "User Not found !",
                false,
                true,
                404
            );
        }
    } catch (error) {
        console.error("Error in withdrawal", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while withdrawing !",
            false,
            true
        );
    }
}




async function Coin_to_Coin(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'reciever_id',
            'gift_id',
            'social_id',
            'live_id',
            'transaction_ref',
            'quantity'
        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            filteredData.sender_id = user_id
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
        if (filteredData.quantity <= 0) {
            return generalResponse(
                res,
                { success: false },
                "Quantity should be greater than 0",
                false,
                true,
                501
            );
        }
        const is_user = await getUser({ user_id })
        if (is_user) {
            const reciever = await getUser({ user_id: filteredData.reciever_id })
            if (reciever) {
                if (!filteredData.gift_id) {
                    return generalResponse(
                        res,
                        { success: false },
                        "Gift Id is Missing",
                        false,
                        true,
                        501
                    );
                }
                const gift = await getGift({ gift_id: filteredData.gift_id })
                if (!(gift.Records.length > 0)) {
                    return generalResponse(
                        res,
                        { success: false },
                        "Gift Not Found",
                        false,
                        true,
                        501
                    );
                }
                if (filteredData.social_id) {
                    const social = await getSocial({ social_id: filteredData.social_id })
                    if (!(social.Records.length > 0)) {
                        return generalResponse(
                            res,
                            { success: false },
                            "Social Not Found",
                            false,
                            true,
                            501
                        );
                    }
                }


                const gift_value = Number(gift.Records[0].gift_value)
                const sender_coin = Number(is_user.toJSON().available_coins)
                filteredData.gift_value = gift_value
                filteredData.coin = gift_value * Number(filteredData.quantity)
                if (sender_coin < filteredData.coin) {

                    return generalResponse(
                        res,
                        { success: false },
                        "Insufficient Coin",
                        false,
                        true,
                        200
                    );
                }
                if (filteredData.live_id && filteredData.transaction_ref == "battle") {
                    const is_battle = await getLive({ live_id: filteredData.live_id, live_status: "live", live_type: "battle" });
                    if (!(is_battle.Records.length > 0)) {
                        return generalResponse(
                            res,
                            { success: false },
                            "Battle Not Found",
                            false,
                            true,
                            501
                        );
                    }
                    const updated_sender = await updateUser({ available_coins: sender_coin - filteredData.coin }, { user_id: is_user.toJSON().user_id })
                    if (updated_sender.length > 0) {
                        // const updated_reciver = await updateUser({ available_coins: Number(reciever.toJSON().available_coins) + filteredData.coin }, { user_id: reciever.toJSON().user_id })
                        filteredData.transaction_ref = "battle"
                        filteredData.success = "waiting_for_battle_results"
                        // in this if the live than check is it the ongoing battle ?
                        // if ongoing battle than the transaction ref will be the battle 
                        // otherwise it will be live 
                        // if the ongoing battle than emmit to the room transaction 
                        const transaction = await createCoinToCoinTransaction(filteredData)
                        // update Hosts 
                        const already_host = await getLiveLive_host({
                            live_id: filteredData.live_id,
                            user_id: filteredData.reciever_id,
                            is_live: true
                        })
                        const updated_hosts = await updateLiveHost(
                            {
                                live_id: filteredData.live_id,
                                user_id: filteredData.reciever_id,
                                is_live: true

                            },
                            {
                                total_gifts: Number(already_host.Records[0].toJSON().total_gifts) + (Number(filteredData.quantity)),
                                total_coins: Number(already_host.Records[0].toJSON().total_coins) + (filteredData.coin),
                            }

                        )

                        // emit to the room 
                        socket_service.emitToRoom(
                            req.body.room_id,
                            "battle_gift_recived",
                            {
                                type: "battle_gift_recv",
                                sender_id: req.authData.user_id,
                                reciever_id: filteredData.reciever_id,
                                gift_id: filteredData.gift_id,
                                quantity: filteredData.quantity,
                                coin: filteredData.coin,
                                live_id: filteredData.live_id,
                                senderData: {
                                    user_id: is_user.user_id,
                                    full_name: is_user.full_name,
                                    profile_pic: is_user.profile_pic
                                }
                            }
                        )
                        if (transaction) {
                            return generalResponse(
                                res,
                                {},
                                `Transaction Successfull ${filteredData.coin} deducted from your Reel Boost Account`,
                                true,
                                true
                            );
                        }
                        else {
                            return generalResponse(
                                res,
                                {},
                                `Transaction Failed !!`,
                                false,
                                true
                            );
                        }



                    }
                    else {
                        filteredData.success = "failed due to sender not updated"
                        const transaction = await createCoinToCoinTransaction(filteredData)
                        return generalResponse(
                            res,
                            {},
                            `Transaction Failed`,
                            false,
                            true
                        );
                    }
                }
                const updated_sender = await updateUser({ available_coins: sender_coin - filteredData.coin }, { user_id: is_user.toJSON().user_id })
                if (updated_sender.length > 0) {
                    const updated_reciver = await updateUser({ available_coins: Number(reciever.toJSON().available_coins) + filteredData.coin }, { user_id: reciever.toJSON().user_id })
                    if (updated_reciver.length > 0) {
                        filteredData.success = "success"
                        // in this if the live than check is it the ongoing battle ?
                        // if ongoing battle than the transaction ref will be the battle 
                        // otherwise it will be live 
                        // if the ongoing battle than emmit to the room transaction 
                        const transaction = await createCoinToCoinTransaction(filteredData)
                        if (transaction) {
                            const notification_user = await getUser({ user_id: filteredData.reciever_id })
                            sendPushNotification(
                                {
                                    playerIds: [notification_user.device_token],
                                    title: "New Gift Recived",
                                    message: `${req.userData.full_name} has send you ${gift.Records[0].name}`,
                                    large_icon: req.userData.profile_pic,
                                    big_picture: gift.Records[0].gift_thumbnail,
                                    data: {
                                        type: "gift_recv",
                                        user_id: req.authData.user_id,
                                        full_name: req.authData.full_name,
                                        profile_pic: req.authData.userData,

                                    }
                                }
                            )
                            if (filteredData.transaction_ref == "live" && req.body.room_id) {
                                socket_service.emitToRoom(
                                    req.body.room_id,
                                    "live_gift_recived",
                                    {
                                        type: "live_gift_recv",
                                        sender_id: req.authData.user_id,
                                        reciever_id: filteredData.reciever_id,
                                        gift_id: filteredData.gift_id,
                                        quantity: filteredData.quantity,
                                        coin: filteredData.coin,
                                        live_id: filteredData.live_id,
                                        senderData: {
                                            user_id: is_user.user_id,
                                            full_name: is_user.full_name,
                                            profile_pic: is_user.profile_pic
                                        }
                                    }
                                )



                                // ================= ACTIVITY STREAM (GIFT) =================


                                console.log("Emitting activity_on_live for gift");






                            }
                            else {

                                const gift = await getGift({ gift_id: filteredData.gift_id })



                                const is_user = await getUser({ user_id: req.authData.user_id })


                                const GiftDetail = gift.Records[0].dataValues;


                                socket_service.emitEvent(
                                    notification_user?.socket_id,
                                    "gift_recived",
                                    {
                                        type: "gift_recv",
                                        user_id: req.authData.user_id,
                                        full_name: is_user.dataValues.full_name,
                                        profile_pic: is_user.dataValues.profile_pic,
                                        user_name: is_user.dataValues.user_name,
                                        GiftName: GiftDetail.name,
                                        Coinsvalues: GiftDetail.gift_value,
                                        gift_thumbnail: GiftDetail.gift_thumbnail,


                                    }
                                );
                            }
                            await createNotification(
                                {
                                    notification_title: "Gift Received",
                                    notification_type: "Gift Received",
                                    sender_id: filteredData.sender_id,
                                    gift_id: filteredData?.gift_id,
                                    reciever_id: Number(filteredData.reciever_id),
                                    notification_description: {
                                        description: `has send you ${gift.Records[0].name}`,
                                        gift_id: filteredData.gift_id,
                                        transaction_id: transaction.transaction_id,
                                    }
                                }
                            )
                            return generalResponse(
                                res,
                                {},
                                `Transaction Successfull ${filteredData.coin} deducted from your Reel Boost Account`,
                                true,
                                true
                            );
                        }
                        else {
                            return generalResponse(
                                res,
                                {},
                                `Transaction Failed !!`,
                                false,
                                true
                            );
                        }

                    }
                    else {
                        filteredData.success = "failed due to reciver not updated"
                        const transaction = await createCoinToCoinTransaction(filteredData)
                        return generalResponse(
                            res,
                            {},
                            `Transaction Failed`,
                            false,
                            true
                        );
                    }

                }
                else {
                    filteredData.success = "failed due to sender not updated"
                    const transaction = await createCoinToCoinTransaction(filteredData)
                    return generalResponse(
                        res,
                        {},
                        `Transaction Failed`,
                        false,
                        true
                    );
                }


            }
            else {
                generalResponse(
                    res,
                    { success: false },
                    "Reciever Not Found",
                    false,
                    true,
                    404
                );
            }

        }
        else {
            return generalResponse(
                res,
                { success: false },
                "User Not found !",
                false,
                true,
                404
            );
        }
    } catch (error) {
        console.error("Error in recharge", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Recharging !",
            false,
            true
        );
    }
}




async function transaction_conf_data(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'transaction_type',

        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
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
        const transaction_conf = await gettransaction_conf({ transaction_type: filteredData.transaction_type })
        if (transaction_conf.Records.length > 0) {
            return generalResponse(
                res,
                transaction_conf,
                `Transaction configuration`,
                true,
                true
            );
        }
        else {
            return generalResponse(
                res,
                {},
                `No Transaction configuration Found`,
                true,
                true
            );
        }
    } catch (error) {
        console.error("Error in Getting transaction configuration", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Getting transaction configuration !",
            false,
            true
        );
    }
}
async function update_transaction_conf_data(req, res) {
    try {
        if (!req.body.transaction_conf_id) {
            return generalResponse(
                res,
                {},
                "transaction_conf_id is required",
                false,
                true
            )
        }
        allowedUpdateFields = [
            'currency',
            'currency_symbol',
            'coin_value_per_1_currency',
            'minimum_transaction',
            'welcome_bonus'
        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
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
        const transaction_conf = await updateTransactionConf({
            transaction_conf_id: req.body.transaction_conf_id
        }, filteredData)

        return generalResponse(
            res,
            transaction_conf,
            `Transaction configuration updated successfully`,
            true,
            true
        );

    } catch (error) {
        console.error("Error in updating transaction configuration", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while updating transaction configuration !",
            false,
            true
        );
    }
}


async function Transaction_history_admin(req, res) {
    try {

        const admin_id = req.authData.admin_id

        const allowedUpdateFields = [
            'transaction_id',
            'success',
            'transaction_id_gateway',
            'transaction_type',
            'transaction_table',
            'transaction_ref',
            'sender_id',
            'reciever_id',
            'gift_id',
            'social_id',
            'all',
            'start_date',
            'end_date',
        ]

        const allowedUpdateFields_for_Money = [
            'transaction_id',
            'success',
            'transaction_id_gateway',
            'transaction_type',
            'user_id',
            'start_date',
            'end_date',
        ]
        const allowedUpdateFields_for_Coin = [
            'transaction_id',
            'success',
            'sender_id',
            'reciever_id',
            'gift_id',
            'social_id',
            'transaction_ref',
            'all',
            'start_date',
            'end_date',
        ]
        let filteredData
        let updatedData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);

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

        const { page = 1, pageSize = 10 } = req.body



        if (filteredData?.transaction_table !== "coin" && filteredData?.transaction_table !== "money") {
            return generalResponse(
                res,
                { success: false },
                "Invalid Transaction Table",
                false,
                true,
                501
            );
        }

        if (filteredData?.transaction_table === "coin") {

            // if (!is_user.is_admin && !filteredData.sender_id && !filteredData.reciever_id) {
            //     return generalResponse(
            //         res,
            //         { success: false },
            //         "Sender or Reciever is Missing",
            //         false,
            //         true,
            //         501
            //     )
            // }

            // if (!req.body.profile_data) {


            //     if (!is_user.is_admin && !filteredData.sender_id) {
            //         if (filteredData.reciever_id != user_id) {

            //             return generalResponse(
            //                 res,
            //                 { success: false },
            //                 "unAuthorized",
            //                 false,
            //                 true,
            //                 403
            //             )
            //         }
            //     }
            // }
            // if (!is_user.is_admin && !filteredData.reciever_id) {
            //     if (filteredData.sender_id != user_id) {

            //         return generalResponse(
            //             res,
            //             { success: false },
            //             "unAuthorized",
            //             false,
            //             true,
            //             403
            //         )
            //     }
            // }

        }
        if (filteredData?.transaction_table === "money") {
            updatedData = Object.fromEntries(
                Object.entries(filteredData).filter(([key]) =>
                    allowedUpdateFields_for_Money.includes(key)
                )
            );
            if (req?.body?.user_id) {
                updatedData.user_id = req.body.user_id

            }
            // else {

            // }
        }
        if (filteredData?.transaction_table === "coin") {
            updatedData = Object.fromEntries(
                Object.entries(filteredData).filter(([key]) =>
                    allowedUpdateFields_for_Coin.includes(key)
                )
            );
        }


        let transactions
        let includeOptions = []
        if (filteredData?.transaction_table == "money") {
            includeOptions = [
                {
                    model: User,
                    as: 'sender',

                    attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
                },
                {
                    model: User,
                    as: 'reciever',
                    attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
                },
                {
                    model: Gift,
                },
                {
                    model: Transaction_plan,
                },

            ]
        } else {
            includeOptions = [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
                },
                {
                    model: User,
                    as: 'reciever',
                    attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
                },
                {
                    model: Gift,
                },


            ]
        }
        //
        if (filteredData.transaction_table == "coin") {
            if (req.body.profile_data) {

                transactions = await getCoinToCoinTransaction(updatedData, { page, pageSize }, [], includeOptions, true)
            }
            else {

                transactions = await getCoinToCoinTransaction(updatedData, { page, pageSize }, [], includeOptions)
            }
        }


        if (filteredData.transaction_table == "money") {

            transactions = await getMoneyCoinTransaction(updatedData, { page, pageSize }, [], [
                {
                    model: Transaction_plan,
                },
                {
                    model: User,
                    attributes: ['user_id', 'first_name', 'last_name', 'email', 'profile_pic', 'is_admin', 'is_private', 'available_coins', 'user_name', 'full_name']
                }
            ])

        }
        if (transactions.Records.length > 0) {
            return generalResponse(
                res,
                transactions,
                `Transaction history`,
                true,
                true
            );
        }
        else {
            return generalResponse(
                res,
                {},
                `No Transaction Found`,
                true,
                true
            );
        }
    } catch (error) {
        console.error("Error in Getting Transaction history", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong Getting Transaction history !",
            false,
            true
        );
    }
}

async function createPlanIntent(req, res) {
    try {
        const authData = req.authData;

        const { plan_id } = req.body;

        if (!plan_id) {
            return generalResponse(
                res,
                { success: false },
                "plan_id is required",
                false,
                true,
                400
            );
        }
        const plan = await getTransactionPlan({ plan_id });
        if (!(plan.Records.length > 0) || plan.Records[0].status === false) {
            return generalResponse(
                res,
                { success: false },
                "Plan Not Found",
                false,
                true,
                404
            );
        }

        const user = await getUser({ user_id: authData.user_id });


        const payent_intent = await createStripeIntent({
            name: user.full_name,
            email: user.email,
            amount: plan.Records[0].corresponding_money * 100, // Amount in cents
            currency: plan.Records[0].currency.toLowerCase(),
        });
        return generalResponse(
            res,
            { clientSecret: payent_intent },
            "Payment Intent Created",
            true,
            true
        );
    } catch (error) {
        console.error("Error in Getting Transaction history", error);
        return generalResponse(
            res,
            { success: false },
            "Something went  !",
            false,
            true
        );
    }
}




async function Transaction_history_BattelWinnor(req, res) {
    try {
        const user_id = req.authData.user_id;

        const {
            page = 1,
            pageSize = 10,
            live_host_id,
        } = req.body;

        if (!live_host_id) {
            return res.status(400).json({
                success: false,
                message: "live_host_id is required",
            });
        }

        const data = await getBattleTransactionHistory(
            user_id,
            live_host_id,
            { page, pageSize }
        );

        return res.status(200).json({
            success: true,
            message: "Battle gift history fetched successfully",
            ...data,
        });

    } catch (error) {
        console.error("Battle gift history error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
}









module.exports = {
    Money_to_coin,
    Coin_to_Coin,
    Coin_to_Money,
    Transaction_history,
    transaction_conf_data,
    Transaction_history_admin,
    update_transaction_conf_data,
    createPlanIntent,
    Transaction_history_BattelWinnor
};  
