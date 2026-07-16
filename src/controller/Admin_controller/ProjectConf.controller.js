const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const updateEnvVariable = require("../../service/common/env.service");
const { getConfig, updateConfig } = require("../../service/repository/Project_conf.service");
const path = require("path");
const fs = require("fs");
const getmac = require("getmac").default;
const os = require("os");
const axios = require("axios");

function getMacAddress() {

    try {
        const mac = getmac();

        return mac
    } catch (err) {
        console.error('Error fetching MAC address:', err);
        return null
    }

}

function getServerIP() {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaceName in networkInterfaces) {
        for (const interface of networkInterfaces[interfaceName]) {
            // Check for IPv4 and non-internal addresses (to exclude localhost)
            if (interface.family === "IPv4" && !interface.internal) {
                return interface.address;
            }
        }
    }

    return "IP address not found";
}

async function get_Config(req, res) {
    try {
        
        const config = await getConfig({ config_id: 1 });
        if (!config) {
            return generalResponse(
                res,
                {},
                "Config not found",
                false,
                true,
                404
            );
        }
        return generalResponse(
            res,
            config,
            "Config found",
            true,
            false,
            200
        );
    }
    catch (error) {
        console.error("Error in fetching Config", error);
        return generalResponse(
            res,
            {},
            error.message,
            false,
            true,
            500
        );
    }
}

async function update_Config(req, res) {
    try {

        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, [
                "phone_authentication",
                "email_authentication",
                "maximum_members_in_group",
                "show_all_contatcts",
                "show_phone_contatcs",
                "google_login_authentication",
                "apple_login_authentication",
                // "app_logo_light", 
                // "app_logo_dark", 
                // "splash_image", 
                "one_signal_app_id",
                "one_signal_api_key",
                "app_name",
                "app_email",
                "app_text",
                "app_primary_color",
                "app_secondary_color",
                "app_ios_link",
                "app_android_link",
                "app_tell_a_friend_text",
                "android_channel_id",
                // "web_logo_light", //
                // "web_logo_dark", //
                "twilio_account_sid",
                "twilio_auth_token",
                "twilio_phone_number",
                "msg_91_auth_key",
                "msg_91_private_key",
                "email_service",
                "smtp_host",
                "email",
                "password",
                "email_title",
                "email_port",
                "copyright_text",
                "privacy_policy",
                "terms_and_conditions",
                "purchase_code",
                "delete_account",
                "s3_region",
                "s3_access_key_id",
                "mediaflow",
                "s3_bucket_name",
                "s3_secret_access_key",
                "stripe",
                "stripe_public_key",
                "stripe_secret_key",
                "gpay",
                "gpay_merch_id",
                "gpay_merch_name",
                "gpay_country_code",
                "gpay_currency_code",
                "apple_pay",
                "apple_pay_merch_id",
                "apple_pay_merch_name",
                "apple_pay_country_code",
                "apple_pay_currency_code",
                "paypal",
                "paypal_public_key",
                "paypal_secret_key",

            ], false);
        }
        catch (err) {
            return generalResponse(
                res,
                {},
                err.message,
                false,
                true
            );
        }
        const envUpdateKeys = [
            "one_signal_app_id",
            "one_signal_api_key",
            "twilio_account_sid",
            "twilio_auth_token",
            "twilio_phone_number",
            "msg_91_auth_key",
            "msg_91_private_key",
            "email_service",
            "smtp_host",
            "email",
            "password",
            "email_port",
            "email_title",
            "app_name",
            "s3_region",
            "s3_access_key_id",
            "mediaflow",
            "s3_bucket_name",
            "s3_secret_access_key",
            "android_channel_id",
            "stripe_secret_key"
        ];


        if (req.app_logo_light?.length > 0) {
            filteredData.app_logo_light = req.app_logo_light[0].path;
        }
        if (req.app_logo_dark?.length > 0) {
            filteredData.app_logo_dark = req.app_logo_dark[0].path;
        }
        if (req.splash_image?.length > 0) {
            filteredData.splash_image = req.splash_image[0].path;
        }
        if (req.web_logo_light?.length > 0) {
            filteredData.web_logo_light = req.web_logo_light[0].path;
        }
        if (req.web_logo_dark?.length > 0) {
            filteredData.web_logo_dark = req.web_logo_dark[0].path;
        }
        if (filteredData.phone_authentication !== undefined || filteredData.email_authentication !== undefined) {
            const oldConfig = await getConfig({ config_id: 1 })

            if (filteredData.phone_authentication !== undefined && filteredData.phone_authentication == false) {
                if (oldConfig.email_authentication == false) {
                    return generalResponse(
                        res,
                        {},
                        "Atleast One authentication method is required",
                        false,
                        true,
                        200
                    )
                }
            }
            if (filteredData.email_authentication !== undefined && filteredData.email_authentication == false) {
                if (oldConfig.phone_authentication == false) {

                    return generalResponse(
                        res,
                        {},
                        "Atleast One authentication method is required",
                        false,
                        true,
                        200
                    )
                }
            }
        }


        const config = await updateConfig(filteredData, { config_id: 1 });
        if (!config) {
            return generalResponse(
                res,
                {},
                "Config not found",
                false,
                true,
                404
            );
        }

        // Update .env file with the new data.
        // "one_signal_app_id",
        //     "one_signal_api_key",
        //     "app_tell_a_friend_text",
        //     "twilio_account_sid",
        //     "twilio_auth_token",
        //     "twilio_phone_number",
        //     "smtp_host",
        //     "sender_email",
        //     "sender_password",

        generalResponse(
            res,
            config,
            "Config updated",
            true,
            false,
            200
        );
        for (const [key, value] of Object.entries(filteredData)) {
            if (envUpdateKeys.includes(key) && value !== undefined) {
                updateEnvVariable(key, value);
            }
        }
        return
    }
    catch (error) {
        console.error("Error in updating Config", error);
        return generalResponse(
            res,
            {},
            error.message,
            false,
            true,
            500
        );
    }
}

// async function usersList(req, res) {
//     try {
//         let admin_id = req.authData.admin_id
//         if (!admin_id) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Only admins can access.",
//                 true,
//                 true,
//             );
//         }

//         let filteredData;
//         try {
//             filteredData = updateFieldsFilter(req.body, ["filter"], false);
//         }
//         catch (err) {
//             return generalResponse(
//                 res,
//                 {},
//                 err.message,
//                 false,
//                 true
//             );
//         }
//         let users = await config_service.usersList();
//         if (filteredData?.filter == 'country') {
//             const usersByCountry = {};
//             users.forEach(user => {
//                 const country = user.country || 'Unknown';

//                 if (!usersByCountry[country]) {
//                     usersByCountry[country] = [];
//                 }

//                 usersByCountry[country].push(user);
//             });
//             users = usersByCountry;
//         }
//         if (!users) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Users not found",
//                 false,
//                 true,
//                 404
//             );
//         }
//         return generalResponse(
//             res,
//             users,
//             "Users found",
//             true,
//             false,
//             200
//         );


//     } catch (error) {
//         console.error("Error in fetching all users", error);
//         return generalResponse(
//             res,
//             {},
//             error.message,
//             false,
//             true,
//             500
//         );
//     }
// }

// async function getGroupChats(req, res) {
//     try {
//         let admin_id = req.authData.admin_id
//         if (!admin_id) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Only admins can access.",
//                 true,
//                 true,
//             );
//         }
//         let chats = await config_service.getGroupChats();

//         if (!chats) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Chats not found",
//                 false,
//                 true,
//                 404
//             );
//         }
//         return generalResponse(
//             res,
//             chats,
//             "Chats found",
//             true,
//             false,
//             200
//         );
//     }
//     catch (error) {
//         console.error("Error in fetching all chats", error);
//         return generalResponse(
//             res,
//             {},
//             error.message,
//             false,
//             true,
//             500
//         );
//     }

// }


async function readToken() {
    const tokenFilePath = path.join(__dirname, "../../../validatedToken.txt");


    if (!fs.existsSync(tokenFilePath)) {
        return false; // No token file found, no verification needed
    }

    try {
        const token = await fs.promises.readFile(tokenFilePath, "utf-8");

        return token

    } catch (error) {
        console.error("Error during token verification:", error);
        return false;
    }
}

async function deactivate(req, res) {
    try {
        

        token = await readToken()
        // Prepare data to send to the third-party API
        const requestData = {
            server_ip: getServerIP(), // Example data
            mac_address: getMacAddress(),
            token: token,
        };
        const base64Url = "aHR0cDovLzYyLjcyLjM2LjI0NToxMTQyL2RlLWFjdGl2YXRl";
        // Decode Base64 back to normal URL
        const apiUrl = Buffer.from(base64Url, "base64").toString("utf-8");

        // Make the third-party API request
        const apiResponse = await axios.post(
            apiUrl,
            requestData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer YOUR_API_TOKEN`, // Replace with actual token if required
                },
            }
        );

        if (apiResponse?.data?.success) {

            return res.status(200).json({
                message: apiResponse.data.message,
                status: true,
            });
        }
        // Handle the API response
        return res.status(200).json({
            message: apiResponse.data.message,
            status: false,
        });

    }
    catch (err) {
        console.error(err);
        res.status(501).json({ error: "Error in Deactivation" });
    }
}
module.exports = {
    get_Config,
    update_Config,
    deactivate
    // usersList,
    // getGroupChats
};
