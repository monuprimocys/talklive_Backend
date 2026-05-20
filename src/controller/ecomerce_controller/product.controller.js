const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const {  getblock } = require("../../service/repository/Block.service");
const { createProduct, getProduct } = require("../../service/repository/Product.service");
const { createProductMedia } = require("../../service/repository/ProductMedia.service");
const {  getSocial, deleteSocial } = require("../../service/repository/SocialMedia.service");
const { getUser } = require("../../service/repository/user.service");
const { Op } = require('sequelize');

async function uploadProduct(req, res) {
    try {
        const user_id = req.authData.user_id

        let allowedUpdateFieldsMandatory = [];
        let allowedUpdateFields = [];
        

        allowedUpdateFieldsMandatory = ['product_title', 'product_desc', 'product_original_price', 'product_sale_price', 'product_price_currency']
        allowedUpdateFields = ['aspect_ratio', 'video_hight', 'product_quantity', 'product_quantity']
        let filteredDataPayload;
        try {
            let filteredDataMandatory = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory,true);
            let filteredData = updateFieldsFilter(req.body, allowedUpdateFields) ;
            filteredData.user_id = user_id
            filteredDataPayload = {...filteredDataMandatory , ...filteredData}
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
        const isUser = await getUser({user_id:filteredDataPayload.user_id})

        if (!isUser) {
            return generalResponse(
                res,
                {},
                "User Not found",
                false,
                true,
                404
            )
        }
        filteredDataPayload.country = isUser.country
        
        if (req?.product_video?.length >0) {
            filteredDataPayload.product_thumbnail = req.product_video[0].path
            filteredDataPayload.product_video = req.product_video[1].path
                
        }
        
        if (req.files.length <= 0) {
            return generalResponse(
                res,
                "Atleast One Image is Required",
                false,
                true,
            );
        }
        const newProduct = await createProduct(filteredDataPayload)
        if(newProduct){
            req.files.map(
                async (image)=>{
                    await createProductMedia({ media_location: image.path, product_id : newProduct.product_id})
                }
            )
            return generalResponse(
                res,
                { },
                "Product Uploaded successfully!",
                true,
                true
            );
        }
        else{
            return generalResponse(
                res,
                { success: false },
                "Something went wrong while uploading Product!",
                false,
                true
            );
        }

    } catch (error) {
        console.error("Error in uploading Product", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while uploading Product!",
            false,
            true
        );
    }
}

async function showProducts(req, res) {
    try {
        const user_id = req.authData.user_id
        const { page = 1, pageSize = 10 } = req.body

        let allowedUpdateFields = [];

        allowedUpdateFields = ['product_id', 'product_title', 'country', 'user_id']
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
        if (await getUser({ user_id })) {
            let excludedUserIds = []
            const uniqueIds = new Set();

            const block1 = await getblock({ user_id: user_id })
            const block2 = await getblock({ blocked_id: user_id })
            if (block1?.Records?.length > 0 || block1?.Records?.length > 0) {
                block1?.Records?.forEach(blocks => {
                    uniqueIds.add(blocks?.dataValues?.blocked_id);
                });
                block2?.Records?.forEach(blocks => {
                    uniqueIds.add(blocks?.dataValues?.user_id);
                });

                excludedUserIds = Array.from(uniqueIds);

            }

            if (excludedUserIds.includes(req.body.user_id)) {
                return generalResponse(
                    res,
                    {
                        Records: [],
                        Pagination: {}
                    },
                    "Products not found",
                    true,
                    true,
                    // 400
                );
                }

            const products = await getProduct(filteredData, pagination = { page, pageSize },excludedUserIds);

            // Filter out blocked users
            if (products?.Records?.length <= 0) {
                return generalResponse(
                    res,
                    {
                        Records: [],
                        Pagination: {}
                    },
                    "Products not found",
                    true,
                    true,
                    // 400
                );
            }

            return generalResponse(
                res,
                {
                    Records: products.Records,
                    Pagination: products.Pagination
                },
                "Products Found",
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
        console.error("Error in finding Products", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding Products!",
            false,
            true
        );
    }
}
async function deleteSocials(req, res) {
    try {
        const user_id = req.authData.user_id
        const { page = 1, pageSize = 10 } = req.body

        let allowedUpdateFields = [];

        allowedUpdateFields = ['social_id']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields ,true);
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

            const socials = await getSocial(filteredData, pagination = { page, pageSize }, excludedUserIds=[]);

            // Filter out blocked users
            if (socials?.Records?.length <= 0) {
                return generalResponse(
                    res,
                    {
                        Records: [],
                        Pagination: {}
                    },
                    "Socials not found",
                    true,
                    true,
                    // 400
                );
            }


            const deletedSocials = await deleteSocial(filteredData)
            if (deletedSocials){
                return generalResponse(
                    res,
                    {
                        
                    },
                    "Socila delted Successfully",
                    true,
                    true
                );
            }

            return generalResponse(
                res,
                {},
                "Social not deleted ",
                false,
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
        console.error("Error in Deleting social", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Deleting social!",
            false,
            true
        );
    }
}
module.exports = {
    uploadProduct,
    showProducts,
    deleteSocials
};  