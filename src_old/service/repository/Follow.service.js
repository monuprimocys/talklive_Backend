const { Op } = require('sequelize');

const { Follow } = require("../../../models");


async function createFollow(followPayload) {
    try {
        const newFollow = await Follow.create(followPayload);
        return newFollow;
    } catch (error) {
        console.error('Error in following:', error);
        throw error;
    }
}
async function getFollow(followPayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page)
        pageSize = Number(pageSize)
        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...followPayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Follow.findAndCountAll(query);

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
        console.error('Error in fetching follows:', error);
        throw error;
    }
}

async function updateFollow(followPayload , followCondition) {
    try {
        const updatedFollow = await Follow.update(followPayload, {where:followCondition});
        return updatedFollow;
    } catch (error) {
        console.error('Error in following:', error);
        throw error;
    }
}
async function deleteFollow(followPayload ) {
    try {
        const unFollow = await Follow.destroy({where:followPayload});
        return unFollow;
    } catch (error) {
        console.error('Error in unfollowing following:', error);
        throw error;
    }
}

async function isFollow(followPayload) {
    try {
        const AlreadyFollow = await Follow.findOne({ where: followPayload });
        return AlreadyFollow;
    } catch (error) {
        console.error('Error in following:', error);
        throw error;
    }
}



module.exports = {
    isFollow,
    createFollow,
    updateFollow,
    deleteFollow,
    getFollow
};