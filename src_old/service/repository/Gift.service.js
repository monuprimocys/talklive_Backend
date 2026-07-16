const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const { Gift  } = require("../../../models");


async function createGift(gift_payload) {
    try {
        const newGift = await Gift.create(gift_payload);
        return newGift;
    } catch (error) {
        console.error('Error creating Gift:', error);
        throw error;
    }
}
async function getGift(gift_payload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], includeOptions = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition--------------------------------------------------------
        let wherecondition = { ...gift_payload }; // Default to the provided payload

        if (!gift_payload.user_id) {
            wherecondition = {
                ...wherecondition,
                user_id: {
                    [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
                },
            };
        }
        if (gift_payload.name) {
            wherecondition.name = { [Op.like]: `%${gift_payload.name}%` };
        }
        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            limit,
            offset,
            order: [
                ['createdAt', 'DESC'],
            ],
            include: includeOptions,
        };
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Gift.findAndCountAll(query);
        
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
        console.error('Error fetching Gift:', error);
        throw error;
    }
}
async function updateGift(gift_payload, updateData, excludedUserIds = []) {
    try {

        // Use the update method to update the records
        const [updatedCount] = await Gift.update(updateData, { where: gift_payload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Gift  Category:', error);
        throw error;
    }
}

async function deleteGift(gift_payload) {
    try {
        // Use the destroy method to delete the records
        const deletedCount = await Gift.destroy({ where: gift_payload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Gift:', error);
        throw error;
    }
}


module.exports = {
    createGift,
    getGift,
    updateGift,
    deleteGift
}