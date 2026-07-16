const { Op } = require('sequelize');
const { Avatar } = require("../../../models");

// Create a new avatar
async function createAvatar(avatarPayload) {
    try {
        const newAvatar = await Avatar.create(avatarPayload);
        return newAvatar;
    } catch (error) {
        console.error('Error creating Avatar:', error);
        throw error;
    }
}

// Get avatars with optional filters, pagination, and ordering
async function getAvatars(filter = {}, pagination = { page: 1, pageSize: 10 }, order = [['createdAt', 'DESC']]) {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const query = {
            where: filter,
            limit,
            offset,
            order,
        };

        const { rows, count } = await Avatar.findAndCountAll(query);

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
        console.error('Error fetching Avatars:', error);
        throw error;
    }
}

// Update avatar(s) by filter
async function updateAvatar(filter, updateData) {
    try {
        const [updatedCount] = await Avatar.update(updateData, { where: filter });
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Avatar:', error);
        throw error;
    }
}

// Delete avatar(s) by filter
async function deleteAvatar(filter) {
    try {
        const deletedCount = await Avatar.destroy({ where: filter });
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Avatar:', error);
        throw error;
    }
}

// Get avatar count by filter
async function getAvatarCount(filter = {}) {
    try {
        const count = await Avatar.count({ where: filter });
        return count;
    } catch (error) {
        console.error('Error in Avatar count:', error);
        throw error;
    }
}

module.exports = {
    createAvatar,
    getAvatars,
    updateAvatar,
    deleteAvatar,
    getAvatarCount,
};