const { generalResponse } = require("../../helper/response.helper");
const { getUser } = require("../../service/repository/user.service");
const { User, Social, Media, Music } = require("../../../models");
const save_service = require("../../service/repository/Save.service");
const like_sevice = require("../../service/repository/Like.service")
const updateFieldsFilter = require("../../helper/updateField.helper");
const filterData = require("../../helper/filter.helper");
const { isFollow } = require("../../service/repository/Follow.service");
const { getComment } = require("../../service/repository/Comment.service");

async function save_unsave(req, res) {
    try {
        const user_id = req.authData.user_id
        allowedUpdateFields = [
            'social_id',
            
        ]
        let filteredData
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            filteredData.save_by = user_id
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }
        const unSave = await save_service.deleteSave(filteredData)

        if (unSave > 0) {


            return generalResponse(
                res,
                {},
                "Unsaved Successfully",
                true,
                true
            );
        }
        const newSave = await save_service.createSave(filteredData)
        if (newSave) {


            return generalResponse(
                res,
                {},
                "Saved Successfully !!",
                true,
                true
            );
        }

        return generalResponse(
            res,
            {},
            "error in saved",
            true,
            false,
            400
        );
    } catch (error) {
        console.error("Error in saved", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Bookmarking!",
            false,
            true
        );
    }
}
async function save_list(req, res) {
    try {
        const user_id = req.authData.user_id
        const page = Number(req.body.page) > 0 ? Number(req.body.page) : 1;
        const pageSize = Number(req.body.pageSize) > 0 ? Number(req.body.pageSize) : 10;

        let allowedUpdateFields = [];

        allowedUpdateFields = ['save_by', 'social_id',]
        allowedIncludeFields = ['Social',  'User']
        let filteredData;
        let includeOptions = []
        const attributes = ['save_by', 'social_id']
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            if (req?.body?.include == 'User') {
                includeOptions = [
                    {
                        model: User,
                        as: 'User',
                        attributes: {
                            exclude: [
                                "password",
                                "otp",
                                "social_id",
                                "id_proof",
                                "selfie",
                                "device_token",
                                "email",
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
                                "is_admin"
                            ],
                        },
                    }
                ]
            }
            if (req?.body?.include == 'Social') {
                includeOptions = [
                    {
                        model: Social,
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
                                        "password",
                                        "otp",
                                        "social_id",
                                        "id_proof",
                                        "selfie",
                                        "device_token",
                                        "email",
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
                                        "is_admin"
                                    ],
                                },
                            }
                        ]
                        // as: 'User',
                    }
                ]
            }
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }
        if (await getUser({ user_id })) {

            const saves = await save_service.getSave(filteredData, includeOptions, attributes,{page , pageSize});

            if (saves?.Records?.length <= 0) {
                return generalResponse(
                    res,
                    { Records: [] },
                    "saves not found",
                    true,
                    true,
                    200
                ); 
            }

            const keysToRemove = [
                "password",
                "otp",
                "id_proof",
                "selfie",
                "device_token"
            ];
            let likeData = saves.Records.map((record) => {
                let rawData = { ...record }; // Extract raw object data

                // Filter the main record data
                keysToRemove.forEach((key) => {
                    rawData = filterData(rawData, key, "key");
                });

                // If 'User' exists, filter its data as well
                if (rawData.User && rawData.User.dataValues) {
                    let userData = { ...rawData.User.dataValues }; // Extract User raw data
                    keysToRemove.forEach((key) => {
                        userData = filterData(userData, key, "key");
                    });
                    rawData.User = userData; // Replace the Sequelize User instance with plain data
                }

                return rawData; // Return the filtered data
            })
            if (req?.body?.include == 'Social') {
                likeData = await Promise.all(saves.Records.map(async (record) => {
                    const likes = await like_sevice.getLike({ like_by: user_id, social_id: record.social_id });
                    record.isLiked = likes.Records.length > 0;
                    
                    const saves = await save_service.getSave({ save_by: user_id, social_id: record.social_id });
                    record.isSaved = saves.Records.length > 0;
                    
                    const isFollowing = await isFollow({ follower_id: user_id, user_id: record.Social.user_id });
                    record.isFollowing = isFollowing ? true : false;
                    
                    const comments  =  await getComment({social_id: record.social_id} )
                    record.total_comments = comments.Pagination.total_records
                    
                    const totalLikes = await like_sevice.getLike({ social_id: record.social_id });
                    record.total_likes = totalLikes.Pagination.total_records
                    
                    const total_saves = await save_service.getSave({ social_id: record.social_id });
                    record.total_saves = total_saves.Pagination.total_records
                    
                    return record;
                }));
            }
            return generalResponse(
                res,
                {
                    Records: likeData,
                    Pagination: saves.Pagination
                },
                "Saves found",
                true,
                false
            );
        } else {
            return generalResponse(
                res,
                {},
                "User not found",
                false,
                true,
                404
            );
        }

    } catch (error) {
        console.error("Error in finding social", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding social!",
            false,
            true
        );
    }
}
async function save_list_admin(req, res) {
    try {
        const page = Number(req.body.page) > 0 ? Number(req.body.page) : 1;
        const pageSize = Number(req.body.pageSize) > 0 ? Number(req.body.pageSize) : 10;

        let allowedUpdateFields = [];

        allowedUpdateFields = ['save_by', 'social_id',]
        allowedIncludeFields = ['Social',  'User']
        let filteredData;
        let includeOptions = []
        const attributes = ['save_by', 'social_id']
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            if (req?.body?.include == 'User') {
                includeOptions = [
                    {
                        model: User,
                        as: 'User',
                        attributes: {
                            exclude: [
                                "password",
                                "otp",
                                "social_id",
                                "id_proof",
                                "selfie",
                                "device_token",
                                "email",
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
                                "is_admin"
                            ],
                        },
                    }
                ]
            }
            if (req?.body?.include == 'Social') {
                includeOptions = [
                    {
                        model: Social,
                        include: [
                            {
                                model: Media,
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
                                        "email",
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
                                        "is_admin"
                                    ],
                                },
                            }
                        ]
                        // as: 'User',
                    }
                ]
            }
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }

            const saves = await save_service.getSave(filteredData, includeOptions, attributes,{page , pageSize});

            if (saves?.Records?.length <= 0) {
                return generalResponse(
                    res,
                    { Records: [] },
                    "saves not found",
                    true,
                    true,
                    200
                ); 
            }

            const keysToRemove = [
                "password",
                "otp",
                "id_proof",
                "selfie",
                "device_token"
            ];
            let likeData = saves.Records.map((record) => {
                let rawData = { ...record }; // Extract raw object data

                // Filter the main record data
                keysToRemove.forEach((key) => {
                    rawData = filterData(rawData, key, "key");
                });

                // If 'User' exists, filter its data as well
                if (rawData.User && rawData.User.dataValues) {
                    let userData = { ...rawData.User.dataValues }; // Extract User raw data
                    keysToRemove.forEach((key) => {
                        userData = filterData(userData, key, "key");
                    });
                    rawData.User = userData; // Replace the Sequelize User instance with plain data
                }

                return rawData; // Return the filtered data
            })
            // if (req?.body?.include == 'Social') {
            //     likeData = await Promise.all(saves.Records.map(async (record) => {
            //         const likes = await like_sevice.getLike({ like_by: user_id, social_id: record.social_id });
            //         record.isLiked = likes.Records.length > 0;
                    
            //         const saves = await save_service.getSave({ save_by: user_id, social_id: record.social_id });
            //         record.isSaved = saves.Records.length > 0;
                    
            //         const isFollowing = await isFollow({ follower_id: user_id, user_id: record.Social.user_id });
            //         record.isFollowing = isFollowing ? true : false;
                    
            //         const comments  =  await getComment({social_id: record.social_id} )
            //         record.total_comments = comments.Pagination.total_records
                    
            //         const totalLikes = await like_sevice.getLike({ social_id: record.social_id });
            //         record.total_likes = totalLikes.Pagination.total_records
                    
            //         const total_saves = await save_service.getSave({ social_id: record.social_id });
            //         record.total_saves = total_saves.Pagination.total_records
                    
            //         return record;
            //     }));
            // }
            return generalResponse(
                res,
                {
                    Records: likeData,
                    Pagination: saves.Pagination
                },
                "Saves found",
                true,
                false
            );
        

    } catch (error) {
        console.error("Error in finding social", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding social!",
            false,
            true
        );
    }
}


module.exports = {
    save_unsave,
    save_list,
    save_list_admin
};  