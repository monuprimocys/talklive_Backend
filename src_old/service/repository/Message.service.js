const { Message } = require("../../../models");
const { toJSONWithAssociations } = require("../../helper/json.hleper");

async function createMessage(messagePayload) {
    try {
        const newMessage = await Message.create(messagePayload);
        return newMessage;
    } catch (error) {
        console.error('Error in Creating Message', error);
        throw error;
    }
}

async function getMessages(messagePayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }, foreignKeysConfig = []) {
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
        const { rows, count } = await Message.findAndCountAll(query);

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
        console.error("Error in fetching Messages:", error);
        throw error;
    }
}


async function updateMessage(filter, updateData) {
    try {
        const updatedMessage = await Message.update(updateData, {
            where: filter,
            returning: true // Ensures it returns updated records (Sequelize-specific)
        });

        return updatedMessage;
    } catch (error) {
        console.error('Error in Updating Message:', error);
        throw error;
    }
}

const getMessage = async (messagePayload) => {
    try {
        const isMessage = await Message.findOne({ where: messagePayload });
        return isMessage;
    } catch (error) {
        console.error('Error in fetching Message:', error);
        throw error;
    }
};

module.exports = {
    createMessage,
    getMessages,
    updateMessage,
    getMessage
};
