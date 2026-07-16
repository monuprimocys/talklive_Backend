const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Live, User, Live_host } = require("../../../models");


async function createLive(livePayload) {
    try {
        const newLive = await Live.create(livePayload);
        return newLive;
    } catch (error) {
        console.error('Error creating Live:', error);
        throw error;
    }
}
async function getLive(livePayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']]) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...livePayload }; // Default to the provided payload

        if (livePayload.live_status == "") {
            delete wherecondition.live_status
        }

        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            include: [
                {
                    model: Live_host,
                    include: [
                        {
                            model: User,
                            attributes: {
                                exclude: [
                                    "password",
                                    "otp",
                                    "social_id",
                                    "id_proof",
                                    "selfie",
                                    "device_token",
                                    "dob",
                                    // "country_code",
                                    // "mobile_num",
                                    // "login_type",
                                    "gender",
                                    "state",
                                    "city",
                                    "bio",
                                    "login_verification_status",
                                    "is_private",
                                    "is_admin",
                                    "intrests",
                                    "socket_id",
                                    "available_coins",
                                    "account_name",
                                    "account_number",
                                    "bank_name",
                                    "swift_code",
                                    "IFSC_code"
                                ],
                            },
                        }
                    ],
                    order: [
                        ['createdAt', 'DESC'],
                    ],
                }
            ],
            order: order,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Live.findAndCountAll(query);

        // Prepare the structured response
        return {
            Records: rows.map(row => row.toJSON()),
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error fetching Live:', error);
        // throw error;
    }
}
async function updateLive(livePayload, updateData, excludedUserIds = []) {
    try {
        console.log("livePayload", livePayload);
        console.log("updateData", updateData);
        
        // Use the update method to update the records
        const [updatedCount] = await Live.update(updateData, { where: livePayload });
        console.log("updatedCount", updatedCount); 
        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Live:', error);
        throw error;
    }
}

async function deleteLive(livePayload) {
    try {
        // Use the destroy method to delete the records

        const [deletedCount] = await Live.update({ live_status: "stopped" }, { where: livePayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Live:', error);
        throw error;
    }
}


//  Delete Live Host



async function delete_live_host({ user_id, live_id }) {
    try {
        if (!user_id) {
            throw new Error("user_id is required");
        }

        const whereCondition = { user_id };

        if (live_id) {
            whereCondition.live_id = live_id;
        }

        const deletedCount = await Live_host.destroy({
            where: whereCondition
        });

        return {
            message: deletedCount > 0
                ? "Live host deleted successfully"
                : "No matching live host found",
            affected_rows: deletedCount
        };
    } catch (error) {
        console.error("Error deleting Live_host:", error);
        throw error;
    }
}




async function getLiveCount(livePayload) {
    try {

        const count = await Live.count({
            where: livePayload,
        });

        return count;
    } catch (error) {
        console.error('Error in Live count:', error);
    }
}

/**
 * Generate a unique room ID
 * @returns {string} - Unique room ID
 */
const generateRoomId = () => {
    const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
    return roomId;
};


module.exports = {
    createLive,
    getLive,
    updateLive,
    deleteLive,
    generateRoomId,
    getLiveCount,
    delete_live_host
}