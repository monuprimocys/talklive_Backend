const { Message_seen } = require("../../../models");
const { toJSONWithAssociations } = require("../../helper/json.hleper");
const { Op } = require("sequelize");

async function createMessageSeen(messagePayload) {
    try {
        const newMessageSeen = await Message_seen.create(messagePayload);
        return newMessageSeen;
    } catch (error) {
        console.error('Error in Creating MessageSeen', error);
        throw error;
    }
}

async function updateMessageSeen(filter, updateData) {
    try {
        const updatedMessageSeen = await Message_seen.update(updateData, {
            where: filter,
            returning: true // Ensures it returns the updated records (Sequelize-specific)
        });
        return updatedMessageSeen;
    } catch (error) {
        console.error('Error in Updating MessageSeen:', error);
        throw error;
    }
}

async function getMessageSeen(messagePayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }, foreignKeysConfig = []) {
    try {
        const { page, pageSize } = pagination;

        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...messagePayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
            order: [["createdAt", "DESC"]], // Order by createdAt descending
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Message_seen.findAndCountAll(query);

        // Convert the rows (Sequelize model instances) to JSON with associations
        const rowsData = await toJSONWithAssociations(rows, foreignKeysConfig);

        // Prepare the structured response
        return {
            Records: rowsData,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: count,
                current_page: page,
                records_per_page: pageSize,
            },
        };
    } catch (error) {
        console.error("Error in fetching MessageSeen:", error);
        throw error;
    }
}

async function getMessageSeenCount({ andConditions = {}, orConditions = {} }) {
    try {
        let whereCondition = {};

        // Handle AND conditions
        if (Object.keys(andConditions).length > 0) {
            whereCondition[Op.and] = Object.entries(andConditions).map(([key, value]) => ({
                [key]: value,
            }));
        }

        // Handle OR conditions
        if (Object.keys(orConditions).length > 0) {
            whereCondition[Op.or] = Object.entries(orConditions).map(([key, value]) => ({
                [key]: value,
            }));
        }

        const query = {
            where: whereCondition,
        };

        const count = await Message_seen.count(query);

        return { count };
    } catch (error) {
        console.error("Error in fetching MessageSeen counts:", error);
        throw error;
    }
}



module.exports = {
    createMessageSeen,
    getMessageSeen,
    getMessageSeenCount,
    updateMessageSeen
};


