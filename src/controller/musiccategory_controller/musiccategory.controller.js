const { generalResponse } = require("../../helper/response.helper");
const { getMusicCategory } = require("../../service/repository/MusicCategory.service");
const { getMusic } = require("../../service/repository/Music.service");
const music_save_service=require("../../service/repository/MusicSave.service");
const { Sequelize } = require("../../../models");


async function showMusicCategory(req,res){

    try{

        const category=await getMusicCategory({
            status:true
        });

        return generalResponse(
            res,
            {
                Records:category
            },
            "Music Categories Found",
            true,
            false
        );

    }catch(err){

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

async function showMusicByCategory(req,res){

    try{

        const user_id = req.authData?.user_id;

        const {cat_id,page=1,pageSize=10}=req.body;

        if(!cat_id){

            return generalResponse(
                res,
                {},
                "cat_id is required",
                false,
                true
            );

        }

        const music=await getMusic({

            cat_id,
            status:true,
            admin_status:true,
            is_original:false

        },{page,pageSize});

        const savedMusic = await music_save_service.getMusicSave(
            { save_by: user_id },
            [],
            ["music_id"],
            {
                page:1,
                pageSize:100000
            }
        );

        const savedIds=new Set(savedMusic.Records.map(x=>x.music_id));

        const musicRecords=music.Records.map(item=>{

            const data=item.toJSON();

            data.is_saved=savedIds.has(item.music_id);

            return data;

        });

        return generalResponse(
            res,
            {
                Records:musicRecords,
                Pagination:music.Pagination
            },
            "Music Found",
            true,
            false
        );

    }catch(err){

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

async function searchMusic(req, res) {
    try {
        const user_id = req.authData?.user_id;
        const { page = 1, pageSize = 10, search = "" } = req.body;

        let filteredData = {};

        if (req.user_type !== "admin") {
            filteredData.status = true;
            filteredData.admin_status = true;
        }

        if (req.user_type === "admin") {
            filteredData.admin_status = true;
        }

        filteredData.is_original = false;

        // Search by music_title
        if (search && search.trim() !== "") {
            filteredData.music_title = {
                [Sequelize.Op.iLike]: `%${search.trim()}%`
            };
        }

        const music = await getMusic(
            filteredData,
            [],
            {},
            { page, pageSize }
        );

        if (music?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "Musics not found",
                true,
                true
            );
        }

        const savedMusic = await music_save_service.getMusicSave(
            { save_by: user_id },
            [],
            ["music_id"],
            {
                page: 1,
                pageSize: 100000
            }
        );

        const savedIds = new Set(savedMusic.Records.map(item => item.music_id));

        const musicRecords = music.Records.map(item => {
            const data = item.toJSON();
            data.is_saved = savedIds.has(item.music_id);
            return data;
        });

        return generalResponse(
            res,
            {
                Records: musicRecords,
                Pagination: music.Pagination
            },
            "Music Found",
            true,
            false
        );

    } catch (error) {
        console.error("Error in searching Music", error);

        return generalResponse(
            res,
            { success: false },
            "Something went wrong while searching Music!",
            false,
            true
        );
    }
}

module.exports={
    showMusicCategory,
    showMusicByCategory,
    searchMusic,
}