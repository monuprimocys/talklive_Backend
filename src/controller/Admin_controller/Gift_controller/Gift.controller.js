const { Gift_category } = require("../../../../models");
const { generalResponse } = require("../../../helper/response.helper");
const updateFieldsFilter = require("../../../helper/updateField.helper");
const { createGift, getGift, deleteGift, updateGift } = require("../../../service/repository/Gift.service");
const { createGiftCategory, getGiftcategory, deleteGiftcategory, updateGiftcategory } = require("../../../service/repository/Gift_category.service");
const { getUser } = require("../../../service/repository/user.service");

async function uploadGiftCategory(req, res) {
    try {
        const admin_id = req.authData.admin_id

        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['name']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
            filteredData.uploader_id = admin_id
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

        const gift_category = await createGiftCategory(
            filteredData
        )
        if (gift_category) {

            return generalResponse(
                res,
                {},
                "Gift Categary added Successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to add Gift category",
            ture,
            true
        )



    } catch (error) {
        console.error("Error in adding Gift category", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while adding Gift category!",
            false,
            true
        );
    }
}

async function showGiftCategory(req, res) {
    try {
        const user_id = req.authData.user_id
        const { page = 1, pageSize = 10 } = req.body

        allowedUpdateFields = ['gift_category_id']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
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

        filteredData.admin_status=true
        if (user_id) {
            filteredData.status = true
        }
        const gift_category = await getGiftcategory(filteredData, pagination = { page, pageSize });

        // Filter out blocked users
        if (gift_category?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "Gift category not found",
                true,
                true,
                // 400
            );
        }


        // Now, you can safely iterate over the records and add the `isLiked` property
        // const likes = await getLike({ like_by: user_id });
        // const likedSocialIds = new Set(likes.Records.map((like) => like.social_id));

        // // Add an `isLiked` property to each social record
        // socials.Records = await Promise.all(socials.Records.map(async (social) => {
        //     // Convert each social object to a plain JSON object
        //     const socialJson = JSON.parse(JSON.stringify(social));

        //     // Fetch comments and likes asynchronously
        //     const comments = await getComment({ social_id: socialJson.social_id });
        //     const likes = await getLike({ social_id: socialJson.social_id });
        //     const isFollowing = await isFollow({ follower_id: user_id, user_id: socialJson.user_id })
        //     // Add the isLiked, total_comments, and total_likes properties
        //     socialJson.isLiked = likedSocialIds.has(socialJson.social_id);
        //     socialJson.total_comments = comments.Pagination.total_records;
        //     socialJson.total_likes = likes.Pagination.total_records;
        //     socialJson.isFollowing = false;
        //     if (isFollowing) {
        //         socialJson.isFollowing = true;
        //     }
        //     // Add the isLiked, total_comments, and total_likes properties


        //     return socialJson;
        // }));
        let records = []
        for (const rec of gift_category.Records) {
            try {
                const gifts = await getGift({ gift_category_id: rec.gift_category_id })
                records.push({ ...rec.dataValues, count: gifts.Pagination.total_records })
            } catch (error) {
                console.error('Error fetching gifts:', error);
            }
        }
        
        return generalResponse(
            res,
            {
                Records: records,
                Pagination: gift_category.Pagination
            },
            "Gift Category Found",
            true,
            false
        );


    } catch (error) {
        console.error("Error in finding Gift category", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding Gift category!",
            false,
            true
        );
    }
}
async function edit_Gift_Category(req, res) {
    try {

        let allowedUpdateFields = [];
        if (!req.body.gift_category_id) {
            return generalResponse(
                res,
                { success: false },
                "gift_category_id is Missing",
                false,
                true
            );
        }
        allowedUpdateFields = ['name', 'status','admin_status']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
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

        const updated_gift_category = await updateGiftcategory(
            { gift_category_id: req.body.gift_category_id },
            filteredData
        )
        return generalResponse(
            res,
            {},
            "Gift Category updated Successfully",
            true,
            true
        );




    } catch (error) {
        console.error("Error in Deleting Gift Category", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Deleting Gift Category!",
            false,
            true
        );
    }
}


async function uploadGift(req, res) {
    try {
        const admin_id = req.authData.admin_id

        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['name', 'gift_value', 'gift_category_id']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
            filteredData.uploader_id = admin_id
            if (process.env.MEDIAFLOW == "S3") {
                if (!req.body.file_media_1) {
                    return generalResponse(
                        res,
                        {},
                        "File Data is missing",
                        false,
                        true,
                        404
                    );
                }
                
                // media_location = req.body.file_media_1
                filteredData.gift_thumbnail = req.body.file_media_1
            }
            else {
                filteredData.gift_thumbnail = req.files[0].path

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


        const is_category = await getGiftcategory({ gift_category_id: filteredData.gift_category_id })

        if (is_category.Records <= 0) {
            return generalResponse(
                res,
                {},
                "Category Not Exist",
                false,
                true,
                404
            )
        }


        const gift = await createGift(
            filteredData
        )

        if (gift) {

            return generalResponse(
                res,
                {},
                "Gift  added Successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to add Gift ",
            ture,
            true
        )



    } catch (error) {
        console.error("Error in adding Gift ", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while adding Gift !",
            false,
            true
        );
    }
}

async function showGift(req, res) {
    try {
        const user_id = req.authData.user_id
        const { page = 1, pageSize = 10 } = req.body

        allowedUpdateFields = ['gift_id', 'gift_category_id', 'name']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
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

        const includeOptions = [
            {
                model: Gift_category
            }
        ]
        if (user_id) {
            filteredData.status = true
        }
        const gift = await getGift(filteredData, pagination = { page, pageSize }, [], includeOptions);

        // Filter out blocked users
        if (gift?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "Gift not found",
                true,
                true,
                // 400
            );
        }

        return generalResponse(
            res,
            {
                Records: gift.Records,
                Pagination: gift.Pagination
            },
            "Gift Category Found",
            true,
            false
        );


    } catch (error) {
        console.error("Error in finding Gift ", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding Gift !",
            false,
            true
        );
    }
}
async function edit_Gift(req, res) {
    try {
        const user_id = req.authData.user_id
        const { page = 1, pageSize = 10 } = req.body

        let allowedUpdateFields = [];

        allowedUpdateFields = ['status', 'name', 'gift_value','gift_category_id']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
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
        if(!req.body.gift_id){
            return generalResponse(
                res,
                { success: false },
                "gift_id is Missing",
                false,
                true
            );
        }

   
        if (process.env.MEDIAFLOW == "S3") {
            if (req.body.file_media_1) {
                filteredData.gift_thumbnail = req.body.file_media_1

            }
            
            // media_location = req.body.file_media_1
        }
        else {
            if (req.files && req.files.length > 0) {

                filteredData.gift_thumbnail = req.files[0].path
            }
        }
        const updatedGift = await updateGift(
            { gift_id: req.body.gift_id },
            filteredData
        )
        const includeOptions = [
            {
                model: Gift_category
            }
        ]
        const newGift = await getGift({ gift_id: req.body.gift_id },{},[],includeOptions)
            return generalResponse(
                res,
                newGift,
                "Gift updated Successfully",
                true,
                true
            );
        

        

    } catch (error) {
        console.error("Error in Deleting Gift ", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Deleting Gift !",
            false,
            true
        );
    }
}
module.exports = {
    uploadGiftCategory,
    showGiftCategory,
    edit_Gift_Category,
    uploadGift,
    showGift,
    edit_Gift
};  