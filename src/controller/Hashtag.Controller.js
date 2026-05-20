const { generalResponse } = require("../helper/response.helper");
const updateFieldsFilter = require("../helper/updateField.helper");
const { getHashTags, createHashtag, getHashtagsWithMinimumReels } = require("../service/repository/hashtag.service");
const { getSocial } = require("../service/repository/SocialMedia.service");

async function findHashtags(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let pagination;
        const { sort_order = "DESC", sort_by = "counts" } = req.body
        allowedUpdateFields = ['hashtag_name', 'hashtag_id']
        allowedUpdateFieldsPagination = ['page', 'pageSize']
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }


        let hashTags = await getHashTags(filteredData, pagination, [], [[sort_by, sort_order]])

        if (hashTags?.Records?.length <= 0) {


            // if (filteredData?.hashtag_name && req.user_type !== "admin"){

            //     const newHashtag = await createHashtag({hashtag_name:req.body?.hashtag_name})

            //     return generalResponse(
            //         res,
            //         { Records: [newHashtag],
            //             Pagination: {
            //                 total_pages: 1,
            //                 total_records: 1,
            //                 current_page: 1,
            //                 records_per_page: 1}

            //          },
            //         "new hashTags Created",
            //         true,
            //         true
            //     );
            // }
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {
                        total_pages: 0,
                        total_records: 0,
                        current_page: 0,
                        records_per_page: 0
                    }
                },
                " hashTags not found created ",
                true,
                true
            );
        }
        if (req.body.add_social) {

            // for (let i = 0; i < hashTags.Records.length; i++) {
            //     const element = hashTags.Records[i];
            //     if (element?.hashtag_name) {
            //         const total_social = await getSocial({ hashtag: element?.hashtag_name }, pagination = { page: 1, pageSize: 1 });
            //         const social = await getSocial({ hashtag: element?.hashtag_name }, pagination = { page: 1, pageSize: req.body.reel_counts || 3 });

            //         if (social?.Records?.length > 0) {
            //             hashTags.Records[i].social = social.Records;
            //             hashTags.Records[i].total_socials = total_social.Pagination.total_records;
            //         } else {
            //             hashTags.Records[i].social = [];
            //             hashTags.Records[i].total_socials = 0;
            //         }

            //     }
            // }

            // const plainHashtags = hashTags.Records.map(h => {
            //     const plain = h.toJSON(); // Sequelize method
            //     plain.social = h.social || [];
            //     plain.total_socials = h.total_socials || 0;

            //     return plain;
            // });

            // return generalResponse(
            //     res,
            //     {
            //         Records: plainHashtags,
            //         Pagination: hashTags.Pagination
            //     },
            //     "hashTags Found",
            //     true,
            //     false,
            // );

            try {
                const { page = 1, pageSize = 10, reel_counts = 1 } = req.body;

                const result = await getHashtagsWithMinimumReels({
                    page,
                    pageSize,
                    minReels: reel_counts
                });

                return generalResponse(
                    res,
                    result,
                    "Hashtags Found",
                    true,
                    false
                );

            } catch (err) {
                console.error('Error fetching hashtags with reels:', err);
                return generalResponse(res, null, "Internal Server Error", false, true);
            }

        }

        return generalResponse(
            res,
            {
                Records: hashTags.Records,
                Pagination: hashTags.Pagination
            },
            "hashTags Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Findng hashTags", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding hashTags!",
            false,
            true
        );
    }
}

async function create_Hashtag(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let filteredData2;
        let pagination;
        allowedUpdateFields = ['hashtag_name']
        allowedUpdateFieldsPagination = ['page', 'pageSize']
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
            filteredData2 = updateFieldsFilter(req.body, allowedUpdateFields, true);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }

        const hashTags = await getHashTags(filteredData, pagination)

        if (hashTags?.Records?.length <= 0) {

            const newHashtag = await createHashtag(filteredData2)
            return generalResponse(
                res,
                { newHashtag: newHashtag },
                "hashTags Created",
                true,
                true
            );
        }


        return generalResponse(
            res,
            {},
            "hashTags Already Exist",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in creating hashTags", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while creating hashTags!",
            false,
            true
        );
    }
}



module.exports = {
    findHashtags,
    create_Hashtag
};  