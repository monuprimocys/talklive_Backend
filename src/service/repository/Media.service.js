const { Op } = require('sequelize');

const {  Media } = require("../../../models");


async function createMedia(mediaPayload) {
    try {
        const newMedia = await Media.create(mediaPayload);
        return newMedia;
    } catch (error) {
        console.error('Error creating media:', error);
        throw error;
    }
}



module.exports = {
    createMedia,
};