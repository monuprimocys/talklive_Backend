const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const { Social, Media, User, Music, Follow } = require("../../../models");


async function createSocial(socialPayload) {
    try {
        const newSocial = await Social.create(socialPayload);
        return newSocial;
    } catch (error) {
        console.error('Error creating Social:', error);
        throw error;
    }
}




async function getSocial(socialPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [
    ['createdAt', 'DESC'],
]) {
    try {

        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...socialPayload }; // Default to the provided payload

        if (!socialPayload.user_id) {
            wherecondition = {
                ...wherecondition,
                user_id: {
                    [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
                },
            };
        }
        if (socialPayload.hashtag) {
            delete wherecondition.hashtag;
            const searchTag = socialPayload.hashtag.toLowerCase();

            wherecondition[Sequelize.Op.and] = Sequelize.literal(`
  EXISTS (
    SELECT 1 FROM unnest("hashtag") AS tag 
    WHERE LOWER(tag) LIKE '${searchTag}'
  )
`);
        }
        let includeoption = []
        if (socialPayload.user_name) {
            delete wherecondition.user_name
            includeoption = [
                {
                    model: Media,
                },
                {
                    model: Music,
                },
                {
                    model: User,
                    where: socialPayload.user_name
                        ? {
                            user_name: {
                                [Sequelize.Op.like]: `%${socialPayload.user_name}%`,
                            },
                        }
                        : undefined,
                    attributes: {
                        exclude: [
                            "password",
                            "otp",
                            "social_id",
                            "id_proof",
                            "selfie",
                            "device_token",
                            // "email",
                            "dob",
                            // "country_code",
                            // "mobile_num",
                            "login_type",
                            "gender",
                            "state",
                            "city",
                            "bio",
                            // "login_verification_status",
                            "is_admin",
                            "intrests",
                            "socket_id",
                            "available_coins",
                            "account_name",
                            "account_number",
                            "bank_name",
                            "swift_code",
                            "IFSC_code",

                        ],
                    },
                }
            ]
        }
        else {
            includeoption = [
                {
                    model: Media,
                },
                {
                    model: Music,
                },
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
                            // "email",
                            "dob",
                            // "country_code",
                            // "mobile_num",
                            // "login_type",
                            "gender",
                            "state",
                            "city",
                            "bio",
                            // "login_verification_status",
                            "is_admin",
                            "intrests",
                            "socket_id",
                            "available_coins",
                            "account_name",
                            "account_number",
                            "bank_name",
                            "swift_code",
                            "IFSC_code",

                        ],
                    },
                }
            ]
        }

        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            include: includeoption,
            order: order,
            distinct: true, // ✅ Fix for incorrect count with includes
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Social.findAndCountAll(query);

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
        console.error('Error fetching Social:', error);
        throw error;
    }
}
async function updateSocial(socialPayload, updateData, excludedUserIds = []) {
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
        const [updatedCount] = await Social.update(updateData, { where: socialPayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Social:', error);
        throw error;
    }
}

async function deleteSocial(socialPayload) {
    try {
        // Use the destroy method to delete the records
        const deletedCount = await Social.destroy({ where: socialPayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Social:', error);
        throw error;
    }
}

async function getSocialCount(socialPayload) {
    try {

        const count = await Social.count({
            where: socialPayload,
        });

        return count;
    } catch (error) {
        console.error('Error in Social count:', error);
    }
}

async function getFollowerSocials(user_id, pagination = { page: 1, pageSize: 10 }, order = [['createdAt', 'DESC']]) {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const query = {
            where: {
                status: true,
                deleted_by_user: false,
                [Sequelize.Op.and]: Sequelize.literal(`EXISTS (
                    SELECT 1 FROM "Follows"
                    WHERE "Follows"."user_id" = "Social"."user_id"
                    AND "Follows"."follower_id" = ${user_id}
                    AND "Follows"."approved" = true
                )`)
            },
            include: [
                {
                    model: Media,
                },
                {
                    model: Music,
                },
                {
                    model: User,
                    attributes: {
                        exclude: [
                            "password", "otp", "social_id", "id_proof", "selfie", "device_token",
                            "email", "dob", "country_code", "mobile_num", "login_type", "gender",
                            "state", "city", "bio", "login_verification_status", "is_admin",
                            "intrests", "socket_id", "available_coins", "account_name",
                            "account_number", "bank_name", "swift_code", "IFSC_code"
                        ],
                    }
                }
            ],
            limit,
            offset,
            order,
            distinct: true, // ✅ Fix for incorrect count with includes
        };

        const { rows, count } = await Social.findAndCountAll(query);

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
        console.error('Error in getFollowerSocialsDB:', error);
        throw error;
    }
}


module.exports = {
    createSocial,
    getSocial,
    updateSocial,
    deleteSocial,
    getSocialCount,
    getFollowerSocials
}