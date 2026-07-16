const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const {Money_coin_transaction} = require('../../../../models');

async function createMoneyCoinTransaction(transaction_payload) {
    try {
        
        const newTransaction = await Money_coin_transaction.create(transaction_payload);
        return newTransaction;
    } catch (error) {
        console.error('Error creating Money Coin Transaction:', error);
        throw error;
    }
}
async function getMoneyCoinTransaction(transaction_payload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [],includeOptions = []) {
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
        if (transaction_payload.start_date && transaction_payload.end_date) {
            delete wherecondition.start_date;
            delete wherecondition.end_date;
            wherecondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.end_date}T23:59:59.999Z`)
                ],
            };
        } else if (transaction_payload.start_date) {
            delete wherecondition.start_date;
            wherecondition.createdAt = {
                [Sequelize.Op.between]: [
                    new Date(`${transaction_payload.start_date}T00:00:00.000Z`),
                    new Date(`${transaction_payload.start_date}T23:59:59.999Z`)
                ],
            };
        }
        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            limit,
            include: includeOptions, // Dynamically include models
            offset,
            order: [
                ['createdAt', 'DESC'],
            ],
        };
        
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Money_coin_transaction.findAndCountAll(query);
        
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
        console.error('Error fetching Money coin Transaction:', error);
        throw error;
    }
}
async function getMoneyCoinTransactionWithoutPagination(transaction_payload) {
    try {
        // Destructure and ensure proper types for pagination values
        
        
        // Build the where condition--------------------------------------------------------
        let wherecondition = { ...transaction_payload }; // Default to the provided payload

        

        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            order: [
                ['createdAt', 'DESC'],
            ],
        };
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Money_coin_transaction.findAndCountAll(query);
        
        // Prepare the structured response
        return {
            Records: rows,
            Count:count
        };
    } catch (error) {
        console.error('Error fetching Money coin Transaction without pagiantion:', error);
        throw error;
    }
}

async function updateMoneyCoinTransaction(updatePayload, condition) {
    try {
        const updatedTransaction = await Money_coin_transaction.update(updatePayload, { where: condition });
        return updatedTransaction;
    } catch (error) {
        console.error("Error updating Money Coin Transaction:", error);
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


module.exports = {
    createMoneyCoinTransaction,
    getMoneyCoinTransaction,
    updateMoneyCoinTransaction,
    getMoneyCoinTransactionWithoutPagination

}