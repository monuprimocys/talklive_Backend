
const { Notification, User, Media, Social, Gift } = require("../../../models");


const getNotifications = async (
    filterPayload = {},
    pagination = { page: 1, pageSize: 10 },
    attributes = [],
    order = [['createdAt', 'DESC']]
) => {
    try {

        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);
        if (!filterPayload.view_status?.trim()) {
            delete filterPayload.view_status;
        }

        const { rows, count } = await Notification.findAndCountAll({
            where: filterPayload,
            ...(attributes.length && { attributes }),
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: 'notification_sender',
                    attributes: ['user_id', 'user_name', 'profile_pic', 'full_name'],
                },
                {
                    model: Gift,
                },
                {
                    model: Social,
                    include: [
                        {
                            model: Media,

                        }
                    ],
                },
            ],
            order: order,
        });

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
        console.error('Error fetching Notification:', error);
        throw new Error('Could not retrieve Notification');
    }
};



async function createNotification(notificationPayload) {
    try {

        const notification = await Notification.create(notificationPayload);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

async function updateNotification(notificationPayload, condition) {
    try {
        const newNotification = await Notification.update(notificationPayload, { where: condition });

        return newNotification;
    } catch (error) {
        // console.error('Error updating Notification:', error);
        return
    }
}

async function deleteNotification(condition = {}) {
    try {
        const deleted = await Notification.destroy({
            where: condition
        });

        return {
            deletedCount: deleted
        };
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}





module.exports = {
    getNotifications,
    createNotification,
    updateNotification,
    deleteNotification
};