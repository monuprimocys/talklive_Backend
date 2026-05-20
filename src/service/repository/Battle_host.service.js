

const { Battle_host, User } = require("../../../models");


async function createBattleHost(battleHostPayload) {
    try {
        const newBattleHost = await Battle_host.create(battleHostPayload);
        return newBattleHost;
    } catch (error) {
        console.error('Error creating Battle_host:', error);
        throw error;
    }
}
async function getBattle_host(battleHostPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...battleHostPayload }; // Default to the provided payload

        // if (livePayload.live_status == ""){
        //     delete wherecondition.live_status
        // }

        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            limit,
            offset,
            include: [
                {
                    model : User,
                    attributes: {
                        exclude: [
                            "password",
                            "otp",
                            "social_id",
                            "id_proof",
                            "selfie",
                            "device_token",
                            "dob",
                            "country_code",
                            "mobile_num",
                            "login_type",
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
        };
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Battle_host.findAndCountAll(query);
        
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
        console.error('Error fetching Battle Host:', error);
        throw error;
    }
}
async function updateBattleHost(battlePayload, updateData, excludedUserIds = []) {
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
        const [updatedCount] = await Battle_host.update(updateData, { where: battlePayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Battle Host:', error);
        throw error;
    }
}

// async function deleteLive(livePayload) {
//     try {
//         // Use the destroy method to delete the records
        
//         const [deletedCount] = await Live.update({ live_status : "stopped"},{ where: livePayload });

//         // Return a structured response
//         return {
//             message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
//             deleted_count: deletedCount,
//         };
//     } catch (error) {
//         console.error('Error deleting Live:', error);
//         throw error;
//     }
// }

// async function getLiveCount(livePayload) {
//     try {

//         const count = await Live.count({
//             where: livePayload,
//         });

//         return count;
//     } catch (error) {
//         console.error('Error in Live count:', error);
//     }
// }

// /**
//  * Generate a unique room ID
//  * @returns {string} - Unique room ID
//  */
// const generateRoomId = () => {
//     const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
//     return roomId;
// };


module.exports = {
    createBattleHost,
    getBattle_host,
    updateBattleHost,
    // deleteLive,
    // generateRoomId,
    // getLiveCount
}