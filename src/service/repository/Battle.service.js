const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Battle, User, Battle_host } = require("../../../models");


async function createBattle(BattlePayload) {
    try {
        const newBattle = await Battle.create(BattlePayload);
        return newBattle;
    } catch (error) {
        console.error('Error creating Battle:', error);
        throw error;
    }
}
async function getBattle(BattlePayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']]) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...BattlePayload }; // Default to the provided payload

        if (BattlePayload.live_status == "") {
            delete wherecondition.live_status
        }

        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            include: [
                {
                    model: Battle_host,
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
        const { rows, count } = await Battle.findAndCountAll(query);

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
        console.error('Error fetching Battle:', error);
        throw error;
    }
}
async function updateBattle(battlePayload, updateData, excludedUserIds = []) {
    try {
        // Ensure the provided socialPayload matches the conditions for updating
        // const { user_id, ...whereConditions } = socialPayload;

        // Add the excluded user IDs condition if necessary
        // const updateQuery = {
        //     where: {
        //         ...whereConditions,
        //         user_id: {
        //             [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
        //         }
        //     },
        // };

        // Use the update method to update the records
        const [updatedCount] = await Battle.update(updateData, { where: battlePayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Battle:', error);
        throw error;
    }
}

async function deleteBattle(battlePayload) {
    try {
        // Use the destroy method to delete the records

        const [deletedCount] = await Battle.update({ live_status: "stopped" }, { where: battlePayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Battle:', error);
        throw error;
    }
}

async function getBatttleCount(battlePayload) {
    try {

        const count = await Battle.count({
            where: battlePayload,
        });

        return count;
    } catch (error) {
        console.error('Error in Battle count:', error);
    }
}

// /**
//  * Generate a unique room ID
//  * @returns {string} - Unique room ID
//  */
// const generateRoomId = () => {
//     const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
//     return roomId;
// };


module.exports = {
    createBattle,
    getBattle,
    updateBattle,
    deleteBattle,
    getBatttleCount
}