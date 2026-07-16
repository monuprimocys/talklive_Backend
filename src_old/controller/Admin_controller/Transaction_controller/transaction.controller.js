


const { getMoneyCoinTransaction, updateMoneyCoinTransaction } = require("../../../service/repository/Transactions/Money_coin_transaction.service");
const { generalResponse } = require("../../../helper/response.helper");
const updateFieldsFilter = require("../../../helper/updateField.helper");
const { getUser } = require("../../../service/repository/user.service");
const { getTransactionPlan, createTransactionPlan, updateTransactionPlan } = require("../../../service/repository/Transactions/Transaction_plan.service");
const { createNotification } = require("../../../service/repository/notification.service");
const { sendPushNotification } = require("../../../service/common/onesignal.service");

async function approve_transaction(req, res) {
    try {
        allowedUpdateFields = [
            'user_id',
            'transaction_id',
            'success',
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

        const transaction = await getMoneyCoinTransaction({ transaction_id: filteredData.transaction_id, user_id: filteredData.user_id })

        if (transaction.Records.length > 0) {
            const [new_transaction] = await updateMoneyCoinTransaction({ success: filteredData.success }, { transaction_id: filteredData.transaction_id })
            if (new_transaction == 0) {
                return generalResponse(
                    res,
                    {},
                    "Transaction Failed",
                    false,
                    true,
                    500
                )
            }
            else {
                const notification_user = await getUser({
                    user_id: filteredData.user_id
                })
                if (filteredData.success == "completed") {
                    sendPushNotification(
                        {
                            playerIds: [notification_user.device_token],
                            title: "Withdrawal Approved",
                            message: `Your withdrawal request of ${transaction.Records[0].acutal_money} ${transaction.Records[0].currency} approved`,
                            data:{
                                type:"withdrawal_approve",
                                trasaction_id: filteredData.transaction_id

                            }
                        }
                    )
                    await createNotification(
                        {
                            notification_title: "Transaction Approved",
                            notification_type: `Transaction Approved`,
                            sender_id: null,
                            reciever_id: Number(req.body.user_id),
                            notification_description: {
                                description: ` Your withdrawal request of ${transaction.Records[0].coin} coins is approved `,
                                transaction_id: Number(req.body.transaction_id),
                                transaction_type: "Withdrawal"
                            }
                        }
                    )
                }
                else if (filteredData.success == "rejected") {

                    sendPushNotification(
                        {
                            playerIds: [notification_user.device_token],
                            title: "Withdrawal Rejected",
                            message: `Your withdrawal request of ${transaction.Records[0].acutal_money} ${transaction.Records[0].currency} is rejected`,
                            data: {
                                type: "withdrawal_reject",
                                trasaction_id: filteredData.transaction_id
                            }
                        }
                    )
                    await createNotification(
                        {
                            notification_title: "Transaction Rejected",
                            notification_type: `Transaction Rejected`,
                            sender_id: null,
                            reciever_id: Number(req.body.user_id),
                            notification_description: {
                                description: ` Your withdrawal request of ${transaction.Records[0].coin} coins is rejected `,
                                transaction_id: Number(req.body.transaction_id),
                                transaction_type: "Withdrawal"
                            }
                        }
                    )
                }



                return generalResponse(
                    res,
                    {},
                    `Transaction ${filteredData.success}`,
                    true,
                    true
                )
            }
        }
        return generalResponse(
            res,
            {},
            "Transaction Not Found",
            false,
            true,
            404
        )


    } catch (error) {
        console.error("Error in approving", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while approving !",
            false,
            true
        );
    }
}


async function add_transaction_plan(req, res) {
    try {

        const admin_id = req.authData.admin_id


        allowedUpdateFields = [
            'plan_name',
            'coins',
            'corresponding_money',
            'currency',
            'currency_symbol',
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

        const transaction_plan = await createTransactionPlan(filteredData)

        if (transaction_plan) {
            return generalResponse(
                res,
                {},
                "Transaction Plan Added",
                true,
                true

            )
        }
        return generalResponse(
            res,
            {},
            "Transaction Plan Not Added",
            false,
            true,
            500
        )
    } catch (error) {
        console.error("error in ading Transaction Plan", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while adding Transaction Plan",
            false,
            false,
            500)

    }
}

async function get_transaction_plan(req, res) {
    try {

        allowedUpdateFields = [
            'plan_id',
            'transaction_type',
        ]
        let filteredData
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
        const { page= 1, pageSize= 10 } = req.body
        if (req.user_type != "admin") {
            filteredData.status= true
         }
        const transaction_plan = await getTransactionPlan(filteredData, { page , pageSize })
        if (transaction_plan.Records.length > 0) {
            return generalResponse(
                res,
                transaction_plan,
                "Transaction Plan Found",
                true,
                true

            )
        }
        return generalResponse(
            res,
            {
                Pagination: {},
                Records: []
            },
            "Transaction Plan Not found",
            true,
            true,
            200
        )
    } catch (error) {
        console.error("error in ading Transaction Plan", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while adding Transaction Plan",
            false,
            false,
            500)

    }
}
async function update_transaction_plan(req, res) {
    try {
        if (!req.body.plan_id) {
            return generalResponse(
                res,
                {},
                "plan_id is required",
                true,
                true,
                422
            )
        }
        allowedUpdateFields = [
            'plan_name',
            'coins',
            'corresponding_money',
            'currency',
            'status',
            'transaction_type'
        ]
        let filteredData
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
        const updated_transaction_plan = await updateTransactionPlan(
            filteredData,
            { plan_id: req.body.plan_id }
        )
        const transaction_plan = await getTransactionPlan({ plan_id: req.body.plan_id })

        if (transaction_plan.Records.length > 0) {
            return generalResponse(
                res,
                transaction_plan,
                "Transaction Plan Updated",
                true,
                true

            )
        }
        return generalResponse(
            res,
            {
                Pagination: {},
                Records: []
            },
            "Transaction Plan Not found",
            true,
            true,
            200
        )
    } catch (error) {
        console.error("error in ading Transaction Plan", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while adding Transaction Plan",
            false,
            false,
            500)

    }
}

module.exports = {
    approve_transaction,
    add_transaction_plan,
    get_transaction_plan,
    update_transaction_plan
};  