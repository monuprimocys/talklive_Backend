const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { Coin_to_coin, Gift, User, Live, Live_host } = require('../../../../models');



async function createCoinToCoinTransaction(transaction_payload) {
    try {
        const newTransaction = await Coin_to_coin.create(transaction_payload);
        return newTransaction;
    } catch (error) {
        console.error('Error creating  Coin Transaction:', error);
        throw error;
    }
}
async function updateCoinToCoinTransaction(updatePayload, condition) {
    try {
        const [affectedRows] = await Coin_to_coin.update(updatePayload, {
            where: condition
        });
        console.log("updatePayload", updatePayload);
        console.log("condition", condition);

        if (affectedRows === 0) {
            console.warn(
                'No Coin transaction updated',
                { updatePayload, condition }
            );
            return null;
        }

        // Fetch updated record explicitly (DB-agnostic)
        return await Coin_to_coin.findOne({
            where: {
                ...condition,
                ...updatePayload
            }
        });

    } catch (error) {
        console.error('Error updating Coin Transaction:', error);
        throw error;
    }
}


// async function getCoinToCoinTransaction(
//     transaction_payload,
//     pagination = { page: 1, pageSize: 10 },
//     excludedUserIds = [],
//     includeOptions = [],
// ) {
//     try {
//         // Destructure pagination values
//         const { page = 1, pageSize = 10 } = pagination;
//         const offset = (Number(page) - 1) * Number(pageSize);
//         const limit = Number(pageSize);

//         // Initialize the where condition with transaction_payload
//         let whereCondition = { ...transaction_payload };

//         // Handle transactions where user_id is either sender or receiver
//         if ( transaction_payload?.all=="true") {

//             delete whereCondition.sender_id; // Remove user_id from the where condition
//             delete whereCondition.reciever_id; // Remove user_id from the where condition
//             whereCondition = {
//                 [Sequelize.Op.or]: [
//                     { sender_id: transaction_payload.sender_id },
//                     { reciever_id: transaction_payload.sender_id }
//                 ]
//             };
//         }

//         // Exclude specific user IDs if user_id is NOT provided
//         if (!transaction_payload.user_id && excludedUserIds.length > 0) {
//             whereCondition.user_id = { [Sequelize.Op.notIn]: excludedUserIds };
//         }

//         // Handle date filtering (single date or range)
//         if (transaction_payload.start_date && transaction_payload.end_date) {
//             delete whereCondition.start_date;
//             delete whereCondition.end_date;
//             whereCondition.createdAt = {
//                 [Sequelize.Op.between]: [new Date(`${transaction_payload.start_date}T00:00:00.000Z`), new Date(`${transaction_payload.end_date}T23:59:59.999Z`)],
//             };
//         } else if (transaction_payload.start_date) {
//             delete whereCondition.start_date;

//             whereCondition.createdAt = {
//                 // [Sequelize.Op.gte]: new Date(transaction_payload.start_date),
//                 [Sequelize.Op.between]: [
//                     new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
//                     new Date(`${transaction_payload.start_date}T23:59:59.999Z`),
//                 ],
//             };
//         }

//         // Construct query
//         const query = {
//             where: whereCondition,
//             limit,
//             include: includeOptions, // Include related models dynamically
//             offset,
//             order: [['createdAt', 'DESC']],
//         };

//         // Fetch transactions
//         const { rows, count } = await Coin_to_coin.findAndCountAll(query);

//         // Return structured response
//         return {
//             Records: rows,
//             Pagination: {
//                 total_pages: Math.ceil(count / pageSize),
//                 total_records: Number(count),
//                 current_page: Number(page),
//                 records_per_page: Number(pageSize),
//             },
//         };
//     } catch (error) {
//         console.error('Error fetching Coin-to-Coin transactions:', error);
//         throw error;
//     }
// }

async function getCoinToCoinTransaction(
    transaction_payload,
    pagination = { page: 1, pageSize: 10 },
    excludedUserIds = [],
    includeOptions = [],
    profile_data = false
) {
    try {
        // Destructure pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);


        // Initialize the where condition with transaction_payload
        let whereCondition = { ...transaction_payload };

        // Handle transactions where user_id is either sender or receiver
        if (transaction_payload?.all === "true") {
            delete whereCondition.sender_id;
            delete whereCondition.reciever_id;
            whereCondition = {
                [Sequelize.Op.or]: [
                    { sender_id: transaction_payload.sender_id },
                    { reciever_id: transaction_payload.sender_id }
                ]
            };
        }

        // Exclude specific user IDs if user_id is NOT provided
        if (!transaction_payload.user_id && excludedUserIds.length > 0) {
            whereCondition.user_id = { [Sequelize.Op.notIn]: excludedUserIds };
        }

        // Handle date filtering (single date or range)
        if (transaction_payload.start_date && transaction_payload.end_date) {
            delete whereCondition.start_date;
            delete whereCondition.end_date;
            whereCondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.end_date}T23:59:59.999Z`)
                ],
            };
        } else if (transaction_payload.start_date) {
            delete whereCondition.start_date;
            whereCondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.start_date}T23:59:59.999Z`)
                ],
            };
        }

        if (profile_data) {
            // Fetch unique coin_id transactions along with total counts
            const transactionsWithCounts = await Coin_to_coin.findAll({
                attributes: [
                    [Sequelize.col('Coin_to_coin.gift_id'), 'gift_id'], // Specify Coin_to_coin.gift_id explicitly
                    [Sequelize.fn('COUNT', Sequelize.col('Coin_to_coin.gift_id')), 'total_count'],
                    [Sequelize.fn('MAX', Sequelize.col('Coin_to_coin.gift_value')), 'gift_value'],
                ],
                where: whereCondition,
                include: [
                    {
                        model: Gift, // Include the Gift table
                        attributes: ['gift_thumbnail'], // Select the gift_image
                    },
                ],
                // group: ['gift_id'],
                group: ['Coin_to_coin.gift_id', 'Gift.gift_id'], // Fully qualify both columns

                order: [[Sequelize.fn('COUNT', Sequelize.col('Coin_to_coin.gift_id')), 'DESC']],
                limit,
                offset,
            });

            // Count total unique coin_id transactions
            const totalRecords = await Coin_to_coin.count({
                distinct: true,
                col: 'gift_id',
                where: whereCondition,
            });

            return {
                Records: transactionsWithCounts,
                Pagination: {
                    total_pages: Math.ceil(totalRecords / pageSize),
                    total_records: Number(totalRecords),
                    current_page: Number(page),
                    records_per_page: Number(pageSize),
                },
            };
        } else {
            // Regular paginated response
            const { rows, count } = await Coin_to_coin.findAndCountAll({
                where: whereCondition,
                limit,
                include: includeOptions, // Include related models dynamically
                offset,
                order: [['createdAt', 'DESC']],
            });

            return {
                Records: rows,
                Pagination: {
                    total_pages: Math.ceil(count / pageSize),
                    total_records: Number(count),
                    current_page: Number(page),
                    records_per_page: Number(pageSize),
                },
            };
        }
    } catch (error) {
        console.error('Error fetching Coin-to-Coin transactions:', error);
        throw error;
    }
}
async function getCoinToCoinTransaction_withoutPagination(
    transaction_payload,
    pagination = { page: 1, pageSize: 10 },
    excludedUserIds = [],
    includeOptions = [],
    profile_data = false
) {
    try {
        // Destructure pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);


        // Initialize the where condition with transaction_payload
        let whereCondition = { ...transaction_payload };

        // Handle transactions where user_id is either sender or receiver
        if (transaction_payload?.all === "true") {
            delete whereCondition.sender_id;
            delete whereCondition.reciever_id;
            whereCondition = {
                [Sequelize.Op.or]: [
                    { sender_id: transaction_payload.sender_id },
                    { reciever_id: transaction_payload.sender_id }
                ]
            };
        }

        // Exclude specific user IDs if user_id is NOT provided
        if (!transaction_payload.user_id && excludedUserIds.length > 0) {
            whereCondition.user_id = { [Sequelize.Op.notIn]: excludedUserIds };
        }

        // Handle date filtering (single date or range)
        if (transaction_payload.start_date && transaction_payload.end_date) {
            delete whereCondition.start_date;
            delete whereCondition.end_date;
            whereCondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.end_date}T23:59:59.999Z`)
                ],
            };
        } else if (transaction_payload.start_date) {
            delete whereCondition.start_date;
            whereCondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.start_date}T23:59:59.999Z`)
                ],
            };
        }

        if (profile_data) {
            // Fetch unique coin_id transactions along with total counts
            const transactionsWithCounts = await Coin_to_coin.findAll({
                attributes: [
                    [Sequelize.col('Coin_to_coin.gift_id'), 'gift_id'], // Specify Coin_to_coin.gift_id explicitly
                    [Sequelize.fn('COUNT', Sequelize.col('Coin_to_coin.gift_id')), 'total_count'],
                    [Sequelize.fn('MAX', Sequelize.col('Coin_to_coin.gift_value')), 'gift_value'],
                ],
                where: whereCondition,
                include: [
                    {
                        model: Gift, // Include the Gift table
                        attributes: ['gift_thumbnail'], // Select the gift_image
                    },
                ],
                // group: ['gift_id'],
                group: ['Coin_to_coin.gift_id', 'Gift.gift_id'], // Fully qualify both columns

                order: [[Sequelize.fn('COUNT', Sequelize.col('Coin_to_coin.gift_id')), 'DESC']],
                // limit,
                // offset,
            });

            // Count total unique coin_id transactions
            const totalRecords = await Coin_to_coin.count({
                distinct: true,
                col: 'gift_id',
                where: whereCondition,
            });

            return {
                Records: transactionsWithCounts,
                Pagination: {
                    total_pages: Math.ceil(totalRecords / pageSize),
                    total_records: Number(totalRecords),
                    current_page: Number(page),
                    records_per_page: Number(pageSize),
                },
            };
        } else {
            // Regular paginated response
            const { rows, count } = await Coin_to_coin.findAndCountAll({
                where: whereCondition,
                // limit,
                include: includeOptions, // Include related models dynamically
                // offset,
                order: [['createdAt', 'DESC']],
            });

            return {
                Records: rows,
                Pagination: {
                    total_pages: Math.ceil(count / pageSize),
                    total_records: Number(count),
                    current_page: Number(page),
                    records_per_page: Number(pageSize),
                },
            };
        }
    } catch (error) {
        console.error('Error fetching Coin-to-Coin transactions:', error);
        throw error;
    }
}

// async function updateGiftcategory(transaction_payload, updateData, excludedUserIds = []) {
//     try {
//         // Ensure the provided socialPayload matches the conditions for updating
//         // const { user_id, ...whereConditions } = socialPayload;

//         // Add the excluded user IDs condition if necessary
//         // const updateQuery = {
//         //     where: {
//         //         ...whereConditions,
//         //         user_id: {
//         //             [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
//         //         }
//         //     },
//         // };

//         // Use the update method to update the records
//         const [updatedCount] = await Gift_category.update(updateData, { where: gift_categoryPayload });

//         // Return a structured response
//         return {
//             message: updatedCount > 0 ? 'Update successful' : 'No records updated',
//             updated_count: updatedCount,
//         };
//     } catch (error) {
//         console.error('Error updating Gift  Category:', error);
//         throw error;
//     }
// }

// async function deleteGiftcategory(transaction_payload) {
//     try {
//         // Use the destroy method to delete the records
//         const deletedCount = await Gift_category.destroy({ where: gift_categoryPayload });

//         // Return a structured response
//         return {
//             message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
//             deleted_count: deletedCount,
//         };
//     } catch (error) {
//         console.error('Error deleting Gift Category:', error);
//         throw error;
//     }
// }




/**
 * Get Battle Winner Transaction History
 * Only records where is_winner = true
 */

// async function getBattleTransactionHistory(user_id, pagination) {
//     const { page = 1, pageSize = 10 } = pagination;
//     const limit = Number(pageSize);
//     const offset = (page - 1) * limit;

//     const { rows, count } = await Coin_to_coin.findAndCountAll({
//         where: {
//             transaction_ref: "battle",
//         },
//         limit,
//         offset,
//         distinct: true,
//         order: [["createdAt", "DESC"]],
//         include: [
//             {
//                 model: Gift,
//                 attributes: ["gift_id", "name", "gift_value", "gift_thumbnail"],
//             },
//             {
//                 association: "sender",
//                 attributes: ["user_id", "user_name", "first_name", "last_name", "profile_pic"],
//             },
//             {
//                 model: Live,
//                 required: true,
//                 include: [
//                     {
//                         model: Live_host,
//                         required: true,
//                         where: {
//                             user_id: user_id,
//                             is_winner: true,
//                         },
//                         attributes: [
//                             "live_host_id", // <-- include live_host_id
//                             "token",        // <-- include token
//                             "total_gifts",
//                             "total_coins",
//                             "status",
//                         ],
//                     },
//                 ],
//             },
//         ],
//     });

//     return {
//         Records: rows,
//         Pagination: {
//             total_pages: Math.ceil(count / limit),
//             total_records: count,
//             current_page: page,
//             records_per_page: limit,
//         },
//     };
// }



async function getBattleTransactionHistory(user_id, live_host_id, pagination) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.pageSize) || 10;
    const offset = (page - 1) * limit;

    // 1️⃣ Get current user's battle info
    const currentHost = await Live_host.findOne({
        where: { live_host_id, user_id },
        attributes: ["live_id", "is_winner", "user_id"],
    });

    if (!currentHost) throw new Error("User not part of this battle");

    // 2️⃣ Get both participants with winner/loser info
    const participants = await Live_host.findAll({
        where: { live_id: currentHost.live_id },
        attributes: ["user_id", "is_winner"],
        raw: true,
    });

    if (participants.length < 2) throw new Error("Battle participants missing");

    const winner = participants.find(p => p.is_winner);
    const loser  = participants.find(p => !p.is_winner);

    if (!winner || !loser) throw new Error("Winner or loser not decided yet");

    const role = currentHost.is_winner ? "winner" : "loser";

    console.log("role", role);

    // 3️⃣ Fetch paginated battle transactions **for the current user** (received gifts)
    // Both winner and loser receive gifts, so we always use reciever_id = current user
    const { rows, count } = await Coin_to_coin.findAndCountAll({
        where: {
            transaction_ref: "battle",
            live_id: currentHost.live_id,
            reciever_id: currentHost.user_id, // ✅ always fetch gifts received by this user
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        distinct: true,
        col: "transaction_id",
        include: [
            {
                model: Gift,
                attributes: ["gift_id", "name", "gift_value", "gift_thumbnail"],
            },
            {
                association: "sender",
                attributes: ["user_id", "user_name", "first_name", "last_name", "profile_pic"],
            },
        ],
    });

    return {
        live_host_id,
        live_id: currentHost.live_id,
        role,
        winner_id: winner.user_id,
        loser_id: loser.user_id,
        Records: rows,
        Pagination: {
            total_pages: Math.ceil(count / limit),
            total_records: count,
            current_page: page,
            records_per_page: limit,
        },
    };
}









module.exports = {
    createCoinToCoinTransaction,
    getCoinToCoinTransaction,
    getCoinToCoinTransaction_withoutPagination,
    updateCoinToCoinTransaction,
    getBattleTransactionHistory
}