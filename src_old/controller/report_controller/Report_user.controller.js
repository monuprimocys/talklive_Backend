const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { isBlocked } = require("../../service/repository/Block.service");
const { createReportUser, getReports } = require("../../service/repository/Report.service");
const { getReport_type } = require("../../service/repository/Report_types.service");
const { getSocial } = require("../../service/repository/SocialMedia.service");
const { getUser } = require("../../service/repository/user.service");
const {User , Report_type} = require("../../../models");
const { Op } = require("sequelize");

async function uploadReportUser(req, res) {
    try {
        const report_by = req.authData.user_id
        const report_to = req.body.user_id
        let allowedUpdateFieldsMandatory = [];

        let filteredData;
        if (!report_by || !report_to) {
            return generalResponse(
                res,
                {},
                "Kindly select a user to report",
                false,
                true,
                402
            );
        }

        if (req.body?.report_type == "others") {
            allowedUpdateFieldsMandatory = ['report_type', 'report_text']

        }
        else {
            allowedUpdateFieldsMandatory = ['report_type_id']
        }
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true,
                402
            );
        }
        if (filteredData?.report_type_id) {
            const isReporttype = await getReport_type({ report_type_id: parseInt(filteredData.report_type_id) })
            if (!isReporttype) {
                return generalResponse(
                    res,
                    {},
                    "Report type Not found",
                    false,
                    true,
                    404
                )
            }
        }
        filteredData.report_by = report_by
        filteredData.report_to = report_to

        const isReporter = await getUser({ user_id: report_by })
        const isUser = await getUser({ user_id: report_to })

        if (!isReporter || !isUser) {
            return generalResponse(
                res,
                {},
                "User Not found",
                false,
                true,
                404
            )
        }

        const newReport = await createReportUser(filteredData)

        if (newReport) {
            return generalResponse(
                res,
                {},
                "Report added successfully",
                true,
                false,

            )
        }

        return generalResponse(
            res,
            {},
            "Failed to Upload post",
            ture,
            true,
            401
        )

    } catch (error) {
        console.error("Error in adding Report User", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Reporting user!",
            false,
            true
        );
    }
}

async function showReportUser(req, res) {
    try {

        let allowedUpdateFields = [];
        const { sorted_by = "createdAt", sort_order="DESC" } = req.body
        allowedUpdateFields = ['report_to','report_by','user_name']
        let filteredData = {};
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
        let includeOptions = []
        if(filteredData?.user_name){
            includeOptions = [
                {
                    model: User,
                    as: "reporter",
                    
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: User,
                    as: "reported",
                    where: {
                        user_name: {
                            [Op.like]: `%${filteredData.user_name}%`
                        }
                    },
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: Report_type,
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                }
            ];
            delete filteredData.user_name
        }
        else{
            includeOptions = [
                {
                    model: User,
                    as: "reporter",
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: User,
                    as: "reported",
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: Report_type,
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                }
            ];  
        }
        
        const page = Number(req.body.page) > 0 ? Number(req.body.page) : 1;
        const pageSize = Number(req.body.pageSize) > 0 ? Number(req.body.pageSize) : 10;

        const reports = await getReports(filteredData, {page:page , pageSize:pageSize}, includeOptions,[[sorted_by,sort_order]]);
        

        if (reports?.Records?.length <= 0) {
            return generalResponse(
                res,
                {},
                "Socials not found",
                false,
                true,
                
            );
        }
        // for (const social of socials.Records) {
        //     const isUserBlocked = await isBlocked({ blocked_id: user_id, user_id: social.user_id }); // Call reusable function
        //     if (!isUserBlocked) {
        //         filteredSocials.push(social);
        //     }
        // }

        // Check if there are any socials left after filtering
  
        return generalResponse(
            res,
            reports,
            "Reports Found",
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
    uploadReportUser,
    showReportUser
};  