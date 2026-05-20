const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const {
    createAvatar,
    getAvatars,
    updateAvatar,
    deleteAvatar,
    getAvatarCount
} = require("../../service/repository/Avatar.service");

// Create Avatar
async function uploadAvatar(req, res) {
    try {
        const allowedFields = ['name', 'avatar_gender'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields, true);
        } catch (err) {
            return generalResponse(res, { success: false }, "Data is Missing", false, true);
        }

        if (req.files?.length == 0) {
            return generalResponse(res, { success: false }, "file is required", false, true);
        }
        // If file upload is used for avatar_media
        if (req.files && req.files[0].path) {
            filteredData.avatar_media = req.files[0].path;
        }
        const avatar = await createAvatar(filteredData);
        return generalResponse(res, avatar, "Avatar Created Successfully", true, false);
    } catch (error) {
        console.error("Error in uploading avatar", error);
        return generalResponse(res, { success: false }, "Something went wrong while uploading avatar!", false, true);
    }
}

// Get Avatars (with pagination/filter)
async function showAvatars(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body;
        const allowedFields = ['avatar_id', 'name', 'avatar_gender', 'status'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }
        // if (req.user_type !== "admin") {
        filteredData.status = true;
        // }
        const avatars = await getAvatars(filteredData, { page, pageSize });
        return generalResponse(res, avatars, "Avatars Found", true, false);
    } catch (error) {
        console.error("Error in finding avatars", error);
        return generalResponse(res, { success: false }, "Something went wrong while finding avatars!", false, true);
    }
}

// Update Avatar
async function updateAvatars(req, res) {
    try {
        const allowedFields = ['name', 'avatar_gender', 'status'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }
        if (!req.body.avatar_id) {
            return generalResponse(res, { success: false }, "avatar_id is required", false, true);
        }
        // If file upload is used for avatar_media
        if (req.files.length > 0 && req.files[0].path) {
            filteredData.avatar_media = req.files[0].path;
        }
        const updateData = { ...filteredData };
        delete updateData.avatar_id;
        const updated = await updateAvatar({ avatar_id: req.body.avatar_id }, updateData);
        const newavatar = await getAvatars({ avatar_id: req.body.avatar_id });
        return generalResponse(res, newavatar, "Avatar Updated", true, false);
    } catch (error) {
        console.error("Error in updating avatar", error);
        return generalResponse(res, { success: false }, "Something went wrong while updating avatar!", false, true);
    }
}

// Delete Avatar
async function deleteAvatars(req, res) {
    try {
        const allowedFields = ['avatar_id'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields, true);
        } catch (err) {
            return generalResponse(res, { success: false }, "Data is Missing", false, true);
        }
        if (!filteredData.avatar_id) {
            return generalResponse(res, { success: false }, "avatar_id is required", false, true);
        }
        const deleted = await deleteAvatar({ avatar_id: filteredData.avatar_id });
        return generalResponse(res, deleted, "Avatar Deleted", true, false);
    } catch (error) {
        console.error("Error in deleting avatar", error);
        return generalResponse(res, { success: false }, "Something went wrong while deleting avatar!", false, true);
    }
}

module.exports = {
    uploadAvatar,
    showAvatars,
    updateAvatars,
    deleteAvatars
};