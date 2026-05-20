const {
  updateUser,
  getUser,
} = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getAvatars } = require("../../service/repository/Avatar.service");
const { getConfig } = require("../../service/repository/Project_conf.service");
const { updateSocial } = require("../../service/repository/SocialMedia.service");

async function updateProfile(req, res) {
  try {

    const pictureType = req.body.pictureType; //id_proof , selfie , profile_pic
    const user_id = req.authData.user_id;
    allowedUpdateFields = [
      "email",
      "password",
      // "full_name",
      "first_name",
      "last_name",
      "user_name",
      "country",
      "country_code",
      "mobile_num",
      "login_type",
      "device_token",
      "password",
      "gender",
      "dob",
      "state",
      "city",
      "bio",
      "profile_verification_status",
      "is_private",
      "account_name",
      "account_number",
      "bank_name",
      "swift_code",
      "IFSC_code",
      "transaction_email",
      "delete",
      "message_price",
      "call_price",
      "video_call_price"
    ];
    let filteredData;
    // if (filteredData)
    let is_demo_user

    try {
      filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
    } catch (err) {
      console.log(err);
      return generalResponse(
        res,
        { success: false },
        "Data is Missing",
        false,
        true
      );
    }
    filteredData.user_id = user_id;
    if (filteredData.last_name && filteredData.first_name) {
      filteredData.full_name = filteredData.first_name + filteredData.last_name
    }
    if (pictureType != undefined && pictureType != "") {
      if (pictureType == "id_proof") {
        filteredData.id_proof = req.files[0].path;
      }
      if (pictureType == "selfie") {
        filteredData.selfie = req.files[0].path;
      }
      if (pictureType == "profile_pic") {
        if (process.env.MEDIAFLOW == "S3") {
          if (!req.body.file_media_1) {
            return generalResponse(
              res,
              { success: false },
              "file_media_1 is required",
              false,
              true
            )
          }
          filteredData.profile_pic = req.body.file_media_1;
        }
        else {
          filteredData.profile_pic = req.files[0].path;
        }

      }
      if (pictureType == "avatar") {
        if (!req.body.avatar_id) {
          return generalResponse(
            res,
            {},
            "Avatar ID is required",
            false,
            true
          );
        }
        const avatar = await getAvatars({ avatar_id: req.body.avatar_id, status: true });


        if (avatar.Records.length == 0) {
          return generalResponse(
            res,
            {},
            "Avatar Not Found",
            false,
            true
          );
        }
        filteredData.profile_pic = avatar.Records[0].avatar_media.replace(/^.*?(uploads\/)/, '$1');
      }
    }

    const isUser = await getUser({ user_id });

    if (isUser) {
      filteredData.login_verification_status = true
      if (filteredData.delete) {
        const project_setting = await getConfig({ config_id: 1 })

        filteredData.full_name = `${project_setting.app_name} User`
        filteredData.first_name = `${project_setting.app_name}`
        filteredData.last_name = " User"
        filteredData.email = null
        filteredData.mobile_num = null
        filteredData.country_code = ""
        filteredData.user_name = null
        filteredData.profile_pic = ""
        filteredData.gender = ""
        filteredData.login_verification_status = false
        filteredData.available_coins = 0
        filteredData.total_socials = 0
        filteredData.platforms = []
        filteredData.is_deleted = true

        const updated_social = await updateSocial(
          {
            user_id: isUser.user_id,
          },
          {
            deleted_by_user: true
          }
        )

      }
      if (req.userData.email == 'demo@reelboost.com' || (req.userData.mobile_num == '1234567890' && req.userData.country_code == '+1')) {
        if (filteredData?.device_token) {
          const isUpdated = await updateUser({ device_token: filteredData.device_token }, {
            user_id: isUser.user_id,
          });
        }
        return generalResponse(
          res,
          req.userData,
          "You can not edit this demo account",
          false,
          true
        )
      }
      const isUpdated = await updateUser(filteredData, {
        user_id: isUser.user_id,
      });
      const updatedUser = await getUser({ user_id });

      if (isUpdated.length > 0) {
        return generalResponse(
          res,
          updatedUser,
          "User updated successfully ",
          true,
          false
        );
      } else {
        return generalResponse(res, {}, "User Not Updated ", false, false);
      }
    } else {
      return generalResponse(
        res,
        { success: false },
        "User Not Updated ",
        false,
        false,
        404
      );
    }
  } catch (err) {
    console.error(err); // log full error for debugging

    let userMessage = "Something went wrong while Signin!";
    let devMessage = err.message;

    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors[0]?.path;
      const value = err.errors[0]?.value;

      if (field === 'mobile_num') {
        userMessage = `Mobile number ${value} is already in use.`;
      }
      if (field === 'email') {
        userMessage = `Email ${value} is already in use.`;
      } else {
        userMessage = `${field} must be unique.`;
      }
    }

    return generalResponse(
      res,
      devMessage,  // developer error message
      userMessage, // user-friendly message
      false,
      true
    );
  }

}
async function updateProfileAdmin(req, res) {
  try {
    const admin_id = req.authData.admin_id;
    if (!req.body.user_id) {
      return generalResponse(
        res,
        {},
        "User ID is required",
        false,
        true
      );
    }
    const user_id = req.body.user_id;
    allowedUpdateFields = [
      "email",
      "password",
      "full_name",
      "user_name",
      "country",
      "country_code",
      "mobile_num",
      "login_type",
      "device_token",
      "password",
      "gender",
      "dob",
      "state",
      "city",
      "bio",
      "profile_verification_status",
      "is_private",
      "account_name",
      "account_number",
      "bank_name",
      "swift_code",
      "IFSC_code",
      "blocked_by_admin",
      "transaction_email"
    ];
    let filteredData;
    try {
      filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
    } catch (err) {
      console.log(err);
      return generalResponse(
        res,
        { success: false },
        "Data is Missing",
        false,
        true
      );
    }
    filteredData.user_id = user_id;

    if (req.body.pictureType && req.body.pictureType != undefined && req.body.pictureType != "") {
      if (req.body.pictureType == "id_proof") {
        filteredData.id_proof = req.files[0].path;
      }
      if (req.body.pictureType == "selfie") {
        filteredData.selfie = req.files[0].path;
      }
      if (req.body.pictureType == "profile_pic") {
        filteredData.profile_pic = req.files[0].path;
      }
    }

    const isUser = await getUser({ user_id });

    if (isUser) {
      const isUpdated = await updateUser(filteredData, {
        user_id: isUser.user_id,
      });
      const updatedUser = await getUser({ user_id });

      if (isUpdated.length > 0) {
        return generalResponse(
          res,
          updatedUser,
          "User updated successfully ",
          true,
          false
        );
      } else {
        return generalResponse(res, {}, "User Not Updated ", false, false);
      }
    } else {
      return generalResponse(
        res,
        { success: false },
        "User Not Updated ",
        false,
        false,
        404
      );
    }
  } catch (err) {
    console.error(err); // log full error for debugging

    let userMessage = "Something went wrong while Signin!";
    let devMessage = err.message;

    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors[0]?.path;
      const value = err.errors[0]?.value;

      if (field === 'mobile_num') {
        userMessage = `Mobile number ${value} is already in use.`;
      }
      if (field === 'email') {
        userMessage = `Email ${value} is already in use.`;
      } else {
        userMessage = `${field} must be unique.`;
      }
    }

    return generalResponse(
      res,
      devMessage,  // developer error message
      userMessage, // user-friendly message
      false,
      true
    );
  }

}

module.exports = {
  updateProfile,
  updateProfileAdmin,
};
