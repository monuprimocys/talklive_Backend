const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { isBlocked } = require("../../service/repository/Block.service");
const { createReportsocial, getSocialReports } = require("../../service/repository/Report_Social.service");
const { getReport_type } = require("../../service/repository/Report_types.service");
const { getSocial } = require("../../service/repository/SocialMedia.service");
const { getUser } = require("../../service/repository/user.service");
const { User, Report_type, Social } = require("../../../models");
const { Op } = require("sequelize");
async function uploadReportSocial(req, res) {
    try {
        const report_by = req.authData.user_id
        let allowedUpdateFieldsMandatory = [];

        let filteredData;
        if (!report_by) {
            return generalResponse(
                res,
                {},
                "Invalid User",
                false,
                true,
            );
        }

        if (req.body?.report_type_id == 0) {
            allowedUpdateFieldsMandatory = ['social_id', 'report_text']
        }
        else {
            allowedUpdateFieldsMandatory = ['social_id', 'report_type_id']
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
                    200
                )
            }
        }
        filteredData.reported_by = report_by


        const newReport = await createReportsocial(filteredData)

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
            "Failed to Report post",
            ture,
            true,
            401
        )

    } catch (error) {
        console.error("Error in adding Report ", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while Reporting !",
            false,
            true
        );
    }
}

async function showReportSocials(req, res) {
    try {

        let allowedUpdateFields = [];

        allowedUpdateFields = ['social_id', 'report_by', 'report_type_id', 'user_name']
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
        let { sort_by = "createdAt", sort_order = "DESC" } = req.body

        let includeOptions = []
        if (filteredData?.user_name) {
            includeOptions = [
                {
                    model: User,
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
               
                {
                    model: Social,
                    include: [
                        {
                            model: User,
                            // where: {
                            //     user_name: {
                            //         [Op.like]: `%${filteredData.user_name}%`
                            //     }
                            // },
                            required: false,
                            attributes: {
                                exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                            }
                        }

                    ],
                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: Report_type,

                }
            ];
            filteredData['$Social.User.user_name$'] = {
                [Op.like]: `%${filteredData.user_name}%`
            };
            delete filteredData.user_name
        }
        else {
            includeOptions = [
                {
                    model: User,

                    attributes: {
                        exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                    }
                },
                {
                    model: Social,
                    include: [
                        {
                            model: User,
                            attributes: {
                                exclude: ['password', 'id_proof', 'selfie', 'account_name', 'account_number', 'bank_name', 'swift_code', 'IFSC_code'] // <-- correct structure
                            }
                        }

                    ],
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

        const reports = await getSocialReports(filteredData, { page: page, pageSize: pageSize }, includeOptions, [[sort_by, sort_order]]);


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
        console.error("Error in finding social reports", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding social reports!",
            false,
            true
        );
    }
}
module.exports = {
    uploadReportSocial,
    showReportSocials
};  