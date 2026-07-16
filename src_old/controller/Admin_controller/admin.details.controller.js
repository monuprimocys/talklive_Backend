const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { updateAdmin, getAdmin } = require("../../service/repository/Admin.service");

async function update_admin(req, res) {
    try {
        
        let allowedUpdateFields = [];
        let filteredData;
        allowedUpdateFields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'profile_pic',
            'country',
            'country_short_name',
            'mobile_number',
            'gender',
            'dob'
        ]
        
        
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                err.message,
                false,
                true
            );
        }
        if (filteredData.first_name && filteredData.last_name ) {
            filteredData.full_name = `${filteredData.first_name} ${filteredData.last_name}`
        }
        if(req?.files?.length>0){
            filteredData.profile_pic = req.files[0].path
        }

        if(filteredData.password){

            if(!req.body.oldpassword){
                return generalResponse(
                    res,
                    {},
                    "Please provide old password",
                    false,
                    true
                );
            }
            if (req.body.oldpassword != req.adminData.password) {
                return generalResponse(
                    res,
                    {},
                    "Old password is incorrect",
                    false,
                    true
                );
            }
        }
        await updateAdmin(
            { filteredData },
            { admin_id: req.adminData.admin_id }
        )

        let updatedAdmin = await getAdmin({ admin_id: req.adminData.admin_id })

        return generalResponse(
            res,
            {
                admin_id: updatedAdmin?.admin_id,
                email: updatedAdmin?.email,
                full_name: updatedAdmin?.full_name,
                first_name: updatedAdmin?.first_name,
                last_name: updatedAdmin?.last_name,
                profile_pic: updatedAdmin?.profile_pic,
                country: updatedAdmin?.country,
                mobile_number: updatedAdmin?.mobile_number,
                gender: updatedAdmin?.gender,
                dob: updatedAdmin?.dob,
                country_short_name: updatedAdmin?.country_short_name,
            },
            "Admin Updated Successfully",
            true,
            true,
        );

    

    } catch (error) {
        console.error("Error in Admin Update", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Updating Admin!",
            false,
            true
        );
    }
}



module.exports = {
    update_admin,
};  