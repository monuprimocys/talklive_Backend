const { Op } = require('sequelize');

const { Like } = require("../../../models");


async function createLike(likePayload) {
    try {
        const newLike = await Like.create(likePayload);
        return newLike;
    } catch (error) {
        console.error('Error in like', error);
        throw error;
    }
}

async function getLike(likePayload, includeOptions = [], attributesOptions = {} ,pagination = { page: 1, pageSize: 10 }, ) {
    try {
        const { page, pageSize } = pagination;
        
        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...likePayload,
            },
            include: includeOptions, // Dynamically include models,
            attributes: attributesOptions,
            limit,
            offset,
        };
        
        // Use findAndCountAll to get both rows and count
        let { rows, count } = await Like.findAndCountAll(query);
        
        rows = rows.map((row) => {
            return row.get()
            
        }); // This invokes Sequelize getters for each record
        
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
        console.error('Error in fetching likes:', error);
        throw error;
    }
}

async function updateLike(likePayload, ) {
    try {
        const updatedLike = await Like.update(likePayload, { where: likeCondition });
        return updatedLike;
    } catch (error) {
        console.error('Error in like', error);
        throw error;
    }
}

async function deleteLike(likePayload) {
    try {
        const unLike = await Like.destroy({ where: likePayload });
        return unLike;
    } catch (error) {
        console.error('Error in like', error);
        throw error;
    }
}


module.exports = {
    createLike,
    updateLike,
    deleteLike,
    getLike
};