const { Op } = require('sequelize');

const { Save } = require("../../../models");


async function createSave(savePayload) {
    try {
        const newSave = await Save.create(savePayload);
        return newSave;
    } catch (error) {
        console.error('Error in save', error);
        throw error;
    }
}

async function getSave(savePayload, includeOptions = [], attributesOptions = {} ,pagination = { page: 1, pageSize: 10 }, ) {
    try {
        
        const { page, pageSize } = pagination;
        
        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...savePayload,
            },
            include: includeOptions, // Dynamically include models,
            attributes: attributesOptions,
            limit,
            offset,
        };
        
        // Use findAndCountAll to get both rows and count
        let { rows, count } = await Save.findAndCountAll(query);
        
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
        console.error('Error in fetching save:', error);
        throw error;
    }
}

async function updateSave(savePayload, ) {
    try {
        const updatedSave = await Save.update(savePayload, { where: savePayload });
        return updatedSave;
    } catch (error) {
        console.error('Error in save', error);
        throw error;
    }
}

async function deleteSave(savePayload) {
    try {
        const unSave = await Save.destroy({ where: savePayload });
        return unSave;
    } catch (error) {
        console.error('Error in save', error);
        throw error;
    }
}


module.exports = {
    createSave,
    updateSave,
    deleteSave,
    getSave
};