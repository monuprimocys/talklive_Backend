const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { createReportTypes,  getReport_types } = require("../../service/repository/Report_types.service");
const { getUser, isAdmin } = require("../../service/repository/user.service");

async function uploadReportTypes(req, res) {
    try {
        const admin_id = req.authData.admin_id
        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['report_text', 'report_for']
        let filteredData;
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
                true
            );
        }




        const newReporttypes = createReportTypes(filteredData)
        if (newReporttypes) {
            return generalResponse(
                res,
                {},
                "Report added successfully",
                true,
                false
            )
        }

        return generalResponse(
            res,
            {},
            "Failed to Upload post",
            ture,
            true,
            500
        )

    } catch (error) {
        console.error("Error in adding Report types", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while uploading Report types!",
            false,
            true
        );
    }
}

async function showReportTypes(req, res) {
    try {
        const user_id = req.authData.user_id

        if (await getUser({ user_id })) {
            const ReportTypes = await getReport_types();
            
            // Filter out blocked users
            if (ReportTypes?.length <= 0) {
                return generalResponse(
                    res,
                    {},
                    "Socials not found",
                    false,
                    true,
                    400
                );
            }


            return generalResponse(
                res,
                { ReportTypes },
                "Reports Found",
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
        console.error("Error in finding report types", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while finding report types    !",
            false,
            true
        );
    }
}
module.exports = {
    showReportTypes,
    uploadReportTypes
};  