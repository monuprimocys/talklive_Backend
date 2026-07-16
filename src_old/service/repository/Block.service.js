const { Op } = require('sequelize');

const { Block } = require("../../../models");


async function createBlock(blockPayload) {
    try {
        const newBlock = await Block.create(blockPayload);
        return newBlock;
    } catch (error) {
        console.error('Error in blocking:', error);
        throw error;
    }
}

async function getblock(blockPayload, includeOptions = [], pagination = { page: 1, pageSize: 10 } , order = [['createdAt', 'DESC']]) {
    try {
        const { page, pageSize } = pagination;
        
        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...blockPayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
            order: order, // Sorting by 'createdAt' in descending order
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Block.findAndCountAll(query);
        
        // Prepare the structured response
        return {
            Records: rows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: count,
                current_page: page,
                records_per_page: pageSize,
            },
        };
    } catch (error) {
        console.error('Error in fetching block list:', error);
        throw error;
    }
}

async function updateblock(blockPayload, blockCondition) {
    try {
        const updatedBlock = await Block.update(blockPayload, { where: blockCondition });
        return updatedBlock;
    } catch (error) {
        console.error('Error in block:', error);
        throw error;
    }
}
async function deleteBlock(blockPayload) {
    try {
        const unBlock = await Block.destroy({ where: blockPayload });
        return unBlock;
    } catch (error) {
        console.error('Error in Unblocking:', error);
        throw error;
    }
}

async function isBlocked(blockPayload) {
    try {
        const AlreadyBlocked = await Block.findOne({ where: blockPayload });
        
        return AlreadyBlocked;
    } catch (error) {
        console.error('Error in blocking:', error);
        throw error;
    }
}



module.exports = {
    isBlocked,

    createBlock,
    deleteBlock,
    getblock
};