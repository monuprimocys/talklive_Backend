const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { Transaction_plan } = require('../../../../models');



async function createTransactionPlan(transaction_payload) {
    try {
        
        const newTransaction = await Transaction_plan.create(transaction_payload);
        return newTransaction;
    } catch (error) {
        console.error('Error creating Transaction Plan:', error);
        throw error;
    }
}
// async function getTransactionPlan(transaction_payload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
//     try {
//         // Destructure and ensure proper types for pagination values
//         const { page = 1, pageSize = 10 } = pagination;
//         const offset = (Number(page) - 1) * Number(pageSize);
//         const limit = Number(pageSize);

//         // Build the where condition--------------------------------------------------------
//         let wherecondition = { ...transaction_payload }; // Default to the provided payload

//         if (!transaction_payload.user_id) {
//             wherecondition = {
//                 ...wherecondition,
//                 user_id: {
//                     [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
//                 },
//             };
//         }

//         // Add pagination options to the payload
//         const query = {
//             where: wherecondition,
//             limit,
//             offset,
//             order: [
//                 ['createdAt', 'DESC'],
//             ],
//         };

//         // Use findAndCountAll to get both rows and count
//         const { rows, count } = await Transaction_plan.findAndCountAll(query);

//         // Prepare the structured response
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
//         console.error('Error fetching  Transaction Plan:', error);
//         throw error;
//     }
// }


async function getTransactionPlan(transaction_payload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Extract optional date filters from transaction_payload
        const { startDate, endDate, specificDate } = transaction_payload;

        // Build the where condition
        let wherecondition = { ...transaction_payload };

        // Remove date filters from payload to prevent overriding
        delete wherecondition.startDate;
        delete wherecondition.endDate;
        delete wherecondition.specificDate;

        // Apply date filters
        if (specificDate) {
            wherecondition.createdAt = {
                [Sequelize.Op.eq]: specificDate, // Exact date match
            };
        } else if (startDate && endDate) {
            wherecondition.createdAt = {
                [Sequelize.Op.between]: [startDate, endDate], // Date range
            };
        }

        // Exclude user_ids if applicable
        if (!transaction_payload.user_id) {
            wherecondition.user_id = {
                [Sequelize.Op.notIn]: excludedUserIds,
            };
        }

        // Query options with filtering and pagination
        const query = {
            where: wherecondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']], // Sort by latest first
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Transaction_plan.findAndCountAll(query);
        
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
        console.error('Error fetching Transaction Plan:', error);
        throw error;
    }
}

async function updateTransactionPlan(updatePayload, condition) {
    try {
        const updatedTransaction = await Transaction_plan.update(updatePayload, { where: condition });
        return updatedTransaction;
    } catch (error) {
        console.error("Error updating  Transaction Plan:", error);
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
    createTransactionPlan,
    getTransactionPlan,
    updateTransactionPlan
}