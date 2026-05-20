const { generalResponse } = require("../../../helper/response.helper");
const updateFieldsFilter = require("../../../helper/updateField.helper");
const { createMusic, getMusic, deleteMusic, updateMusic } = require("../../../service/repository/Music.service");
const { getUser } = require("../../../service/repository/user.service");

async function uploadMusic(req, res) {
    try {

        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['music_title']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
            filteredData.uploader_id = req.authData.admin_id
            if (process.env.MEDIAFLOW == "S3") {
                if (!req.body.file_media_1 || !req.body.file_media_2) {
                    return generalResponse(
                        res,
                        { success: false },
                        "file_media_1 and file_media_2 are required",
                        false,
                        true
                    )
                }
                filteredData.music_thumbnail = req.body.file_media_1
                filteredData.music_url = req.body.file_media_2
            }
            else {


                filteredData.music_thumbnail = req.files[0].path
                filteredData.music_url = req.files[1].path
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



        const music = await createMusic(
            filteredData
        )
        if (music) {

            return generalResponse(
                res,
                {},
                "Music Uploaded Successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to Upload Music",
            ture,
            true
        )



    } catch (error) {
        console.error("Error in uploading music", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while uploading music!",
            false,
            true
        );
    }
}

async function showMusic(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body

        allowedUpdateFields = ['music_id']
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
        if (req.user_type !== "admin") {
            filteredData.status = true,
                filteredData.admin_status = true
        }
        if (req.user_type == "admin") {
            filteredData.admin_status = true
        }

        const music = await getMusic(filteredData, pagination = { page, pageSize });

        // Filter out blocked users
        if (music?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "Musics not found",
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
        return generalResponse(
            res,
            {
                Records: music.Records,
                Pagination: music.Pagination
            },
            "Music Found",
            true,
            false
        );


    } catch (error) {
        console.error("Error in finding Music", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding Music!",
            false,
            true
        );
    }
}

async function delete_Music(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body

        let allowedUpdateFields = [];

        allowedUpdateFields = ['music_id', 'status', 'admin_status']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
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


        const music = await getMusic(filteredData, pagination = { page, pageSize }, excludedUserIds = []);

        // Filter out blocked users
        if (music?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "music not found",
                true,
                true,
            );
        }


        const deletedMusic = await deleteMusic(filteredData)
        if (deletedMusic) {
            return generalResponse(
                res,
                {

                },
                "music delted Successfully",
                true,
                true
            );
        }

        return generalResponse(
            res,
            {},
            "music not deleted ",
            false,
            false
        );


    } catch (error) {
        console.error("Error in Deleting music", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Deleting music!",
            false,
            true
        );
    }
}
async function update_Music(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body

        if (!req.body.music_id) {
            return generalResponse(res, {}, "music_id is required", false, true, 200)
        }
        allowedUpdateFields = ['admin_status', 'status', 'music_desc', 'music_title', 'owner']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields);
            if (process.env.MEDIAFLOW == "S3" && req.body.file_media_1) {

                filteredData.music_thumbnail = req.body.file_media_1
            }
            else {
                if (req.files && req.files && req.files.length > 0) {


                    filteredData.music_thumbnail = req.files[0].path

                }
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


        const music = await getMusic({ music_id: req.body.music_id }, pagination = { page, pageSize }, excludedUserIds = []);

        // Filter out blocked users
        if (music?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "music not found",
                true,
                true,
            );
        }


        const updated_music = await updateMusic({ music_id: req.body.music_id }, filteredData)
        const new_music = await getMusic({ music_id: req.body.music_id }, pagination = { page, pageSize }, excludedUserIds = []);

        if (updated_music) {
            return generalResponse(
                res,
                new_music,
                "music updated Successfully",
                true,
                true
            );
        }

        return generalResponse(
            res,
            {},
            "music not deleted ",
            false,
            false
        );


    } catch (error) {
        console.error("Error in Deleting music", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Deleting music!",
            false,
            true
        );
    }
}
module.exports = {
    uploadMusic,
    showMusic,
    // delete_Music,
    update_Music
};  