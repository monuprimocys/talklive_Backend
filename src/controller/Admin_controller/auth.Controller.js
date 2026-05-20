const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const AuthService = require("../../service/common/auth.service");
const { getAdmin } = require("../../service/repository/Admin.service");
const { generateToken } = require("../../service/common/token.service");

async function login_admin(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        allowedUpdateFields = ['email', 'password']



        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
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

        let isAdmin = await getAdmin({ email: filteredData.email, password: filteredData.password })
        
        if (isAdmin == null) {
            return generalResponse(
                res,
                { 
                   
                 },
                "Invalid Credentials",
                false,
                true
            );
        }
        else {
            
            const token = await generateToken({ admin_id: isAdmin.admin_id  , user_type: "admin" })
            
            return generalResponse(
                res,
                {
                    admin_id: isAdmin?.admin_id,
                    email: isAdmin?.email,
                    full_name: isAdmin?.full_name,
                    first_name: isAdmin?.first_name,
                    last_name: isAdmin?.last_name,
                    profile_pic: isAdmin?.profile_pic,
                    country: isAdmin?.country,
                    country_short_name: isAdmin?.country_short_name,
                    token,
                },
                "Admin Loged in Successfully",
                true,
                true,
            );


        }
    } catch (error) {
        console.error("Error in Admin Login", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Signin!",
            false,
            true
        );
    }
}



module.exports = {
    login_admin,
};  