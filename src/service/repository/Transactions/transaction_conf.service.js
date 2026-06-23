const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { Transaction_conf } = require('../../../../models');
const { getTransactionPlan } = require('./Transaction_plan.service');



async function create_transaction_conf(transaction_payload) {
    try {
        const newTransaction = await Transaction_conf.create(transaction_payload);
        return newTransaction;
    } catch (error) {
        console.error('Error creating Transaction conf:', error);
        throw error;
    }
}
async function gettransaction_conf(transaction_payload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition--------------------------------------------------------
        let wherecondition = { ...transaction_payload }; // Default to the provided payload

        if (!transaction_payload.user_id) {
            wherecondition = {
                ...wherecondition,
                user_id: {
                    [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
                },
            };
        }

        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            order: [
                ['createdAt', 'DESC'],
            ],
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Transaction_conf.findAndCountAll(query);

        // Prepare the structured response
        return {
            Records: rows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error fetching Transaction conf', error);
        throw error;
    }
}

async function updateTransactionConf(filter, updateData) {
    try {
        const [updatedCount] = await Transaction_conf.update(updateData, { where: filter });
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Transaction_conf:', error);
        throw error;
    }
}

// Not Required till
async function Money_after_tax(transaction_payload) {
    try {
        const newTransaction = await Transaction_conf.create(transaction_payload);
        return newTransaction;
    } catch (error) {
        console.error('Error creating Transaction conf:', error);
        throw error;
    }
}

// Not Required till
async function Money_after_admin_margin(transaction_payload) {
    try {
        const newTransaction = await gettransaction_conf({});
        return newTransaction;
    } catch (error) {
        console.error('Error creating Transaction conf:', error);
        throw error;
    }
}

// recharge
async function get_coin_value_from_money(transaction_payload) {
    try {
        const recharge_conf = await getTransactionPlan({ plan_id: transaction_payload.plan_id });
        //   recharge_conf.Records[0].toJSON());
        
        const coins_per_plan = recharge_conf.Records[0].toJSON().coins;
        const corresponding_money = recharge_conf.Records[0].toJSON().corresponding_money;
        const coin_value_per_1_currency = parseFloat((coins_per_plan / corresponding_money).toFixed(2));

        if (!recharge_conf.Records || recharge_conf.Records.length === 0) {
            throw new Error("Recharge configuration not found.");
        }

        
        return { coins: coins_per_plan, coin_value_per_1_currency: coin_value_per_1_currency, corresponding_money: corresponding_money };
    } catch (error) {
        console.error("Error calculating coins from money:", error);
        throw error;
    }
} 

// Withdrawal
async function get_money_value_from_coin(transaction_payload) {
    try {
        const withdraw_conf = await gettransaction_conf({ transaction_type: "withdrawal" });

        if (!withdraw_conf.Records || withdraw_conf.Records.length === 0) {
            throw new Error("Withdrawal configuration not found.");
        }

        const money = transaction_payload.Coins / withdraw_conf.Records[0].coin_value_per_1_currency;
        return money;
    } catch (error) {
        console.error("Error calculating money from coins:", error);
        throw error;
    }
}

module.exports = {
    create_transaction_conf,
    gettransaction_conf,
    Money_after_tax,
    Money_after_admin_margin,
    get_coin_value_from_money,
    get_money_value_from_coin,
    updateTransactionConf
}