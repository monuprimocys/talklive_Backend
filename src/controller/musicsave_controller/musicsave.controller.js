const { generalResponse } = require("../../helper/response.helper");
const { getUser } = require("../../service/repository/user.service");
const { User, Social, Media, Music, MusicSave } = require("../../../models");
const music_save_service = require("../../service/repository/MusicSave.service");
const like_sevice = require("../../service/repository/Like.service")
const updateFieldsFilter = require("../../helper/updateField.helper");
const filterData = require("../../helper/filter.helper");
const { isFollow } = require("../../service/repository/Follow.service");
const { getComment } = require("../../service/repository/Comment.service");
const { Op, Sequelize } = require("sequelize");


async function music_save_unsave(req, res) {
    try {
        const user_id = req.authData.user_id;

        const filteredData = {
            save_by: user_id,
            music_id: req.body.music_id,
        };

        const deleted = await music_save_service.deleteMusicSave(filteredData);

        if (deleted > 0) {
            return generalResponse(
                res,
                {},
                "Music Unsaved Successfully",
                true,
                true
            );
        }

        await music_save_service.createMusicSave(filteredData);

        return generalResponse(
            res,
            {},
            "Music Saved Successfully",
            true,
            true
        );
    } catch (err) {
        console.log(err);

        return generalResponse(
            res,
            {},
            "Something went wrong",
            false,
            true
        );
    }
}

async function music_save_list(req, res) {

    const user_id = req.authData.user_id;

    const page = Number(req.body.page) || 1;
    const pageSize = Number(req.body.pageSize) || 10;

   const saves = await music_save_service.getMusicSave(
    { save_by: user_id },
    [
        {
            model: Music
        }
    ],
    ["save_by", "music_id"],
    {
        page,
        pageSize
    }
);

    return generalResponse(
        res,
        saves,
        "Music Saves Found",
        true,
        false
    );
}

module.exports = {
    music_save_unsave,
    music_save_list,
}; 