const { Op } = require('sequelize');

const { Taged } = require("../../../models");



async function createTagUsers(tagedPayload) {
    try {
        const newTagedUsers = await Taged.create(tagedPayload);
        return newTagedUsers;
    } catch (error) {
        console.error('Error taging user:', error);
        throw error;
    }
}



module.exports = {
    createTagUsers,
};