const { Op } = require('sequelize');

const { Product_Media } = require("../../../models");


async function createProductMedia(productMediaPayload) {
    try {
        const newProductMedia = await Product_Media.create(productMediaPayload);
        return newProductMedia;
    } catch (error) {
        console.error('Error creating Product Media:', error);
        throw error;
    }
}

module.exports = {
    createProductMedia,
};