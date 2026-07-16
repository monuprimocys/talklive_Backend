const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const { Music  } = require("../../../models");


async function createMusic(musicPayload) {
    try {
        const newMusic = await Music.create(musicPayload);
        return newMusic;
    } catch (error) {
        console.error('Error creating Music:', error);
        throw error;
    }
}
async function getMusic(musicPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition--------------------------------------------------------
        let wherecondition = { ...musicPayload }; // Default to the provided payload

        if (!musicPayload.user_id) {
            wherecondition = {
                ...wherecondition,
                user_id: {
                    [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
                },
            };
        }

        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            limit,
            offset,
            order: [
                ['createdAt', 'DESC'],
            ],
        };
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Music.findAndCountAll(query);
        
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
        console.error('Error fetching Music:', error);
        throw error;
    }
}
async function updateMusic(musicPayload, updateData, excludedUserIds = []) {
    try {
        // Ensure the provided socialPayload matches the conditions for updating
        // const { user_id, ...whereConditions } = socialPayload;

        // Add the excluded user IDs condition if necessary
        // const updateQuery = {
        //     where: {
        //         ...whereConditions,
        //         user_id: {
        //             [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
        //         }
        //     },
        // };

        // Use the update method to update the records
        const [updatedCount] = await Music.update(updateData, { where: musicPayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Music:', error);
        throw error;
    }
}

async function deleteMusic(musicPayload) {
    try {
        
        // Use the destroy method to delete the records
        const deletedCount = await Music.destroy({ where: musicPayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Music:', error);
        throw error;
    }
}


module.exports = {
    createMusic,
    getMusic,
    updateMusic,
    deleteMusic
}