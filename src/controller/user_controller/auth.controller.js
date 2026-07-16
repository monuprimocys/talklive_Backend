const {
  createUser,
  getUser,
  updateUser,
} = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const AuthService = require("../../service/common/auth.service");
const {
  sendEmailOTP,
  generateOTP,
  verifyOtp,
  sendTwilioOTP,
} = require("../../service/common/otp.service");
const { generateToken } = require("../../service/common/token.service");
const filterData = require("../../helper/filter.helper");
const {
  gettransaction_conf,
} = require("../../service/repository/Transactions/transaction_conf.service");

async function signupUser(req, res) {
  try {
    const type = req.body.login_type;
    let isdemo = false;
    let allowedUpdateFields = [];
    let filteredData;
    let isUser;
    if (!req.body.platform) {
      return generalResponse(res, {}, "Platform is required", false, true, 400);
    }
    if (req?.body?.password) {
      let hashedPassword = req.body.password;
      hashedPassword = await AuthService.encryptPassword(hashedPassword);
      req.body.password = hashedPassword;
    }

    let otp = await generateOTP();

    if (type == "email") {
      allowedUpdateFields = ["email", "login_type", "voip_token"];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
      } catch (err) {
        console.log(err);

        return generalResponse(res, {}, "Data is Missing", false, true);
      }
      if (
        filteredData.email == "demo@reelboost.com" &&
        process.env.ISDEMO == "true"
      ) {
        isdemo = true;
      }

      isUser = await getUser({ email: filteredData.email });
    } else if (type == "phone") {
      allowedUpdateFields = [
        "mobile_num",
        "country_code",
        "login_type",
        "country_short_name",
        "country",
        "voip_token",
      ];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
      } catch (err) {
        console.log(err);

        return generalResponse(res, {}, "Data is Missing", false, true);
      }
      if (
        filteredData.phone == "1234567890" &&
        filteredData.country_code == "+1" &&
        process.env.ISDEMO == "true"
      ) {
        isdemo = true;
      }

      isUser = await getUser(
        {
          mobile_num: filteredData.mobile_num,
          country_code: filteredData.country_code,
        },
        true,
      );
      console.log("isUser Get user detail", isUser);
    } else if (type == "social") {
      req.body.login_verification_status = true;

      allowedUpdateFields = [
        "email",
        "login_type",
        "device_token",
        "first_name",
        "last_name",
        "voip_token",
      ];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
      } catch (err) {
        console.log(err);

        return generalResponse(res, {}, "Data is Missing", false, true);
      }

      isUser = await getUser(filteredData);
    }

    if (isUser?.blocked_by_admin == true) {
      return generalResponse(
        res,
        {},
        "User Blocked by Admin",
        false,
        true,
        400,
      );
    }
    if (isUser == null) {
      const transaction_conf_data = await gettransaction_conf({
        transaction_type: "withdrawal",
      });
      filteredData.available_coins =
        transaction_conf_data.Records[0].welcome_bonus;
      filteredData.otp = isdemo ? "1234" : otp;

      filteredData.platforms = [req.body.platform];
      const newUser = await createUser(filteredData);

      const keysToRemove = [
        "password",
        "otp",
        "social_id",
        "id_proof",
        "selfie",
        "device_token",
      ];

      const user = filterData(newUser, keysToRemove, (mode = "key"));
      // const countryEntry = await createCountry(filteredData)
      if (type == "email") {
        const sendOtp = isdemo ? true : await sendEmailOTP(req.body.email, otp);
        if (sendOtp) {
          return generalResponse(
            res,
            { newUser: true },
            "Otp Sent Successfully",
            true,
            true,
          );
        }
        return generalResponse(
          res,
          {},
          "Failed to send on email ",
          false,
          true,
        );
      }

      if (type == "phone") {
        let sendOtp = false;
        sendOtp = isdemo
          ? true
          : await sendTwilioOTP(
              newUser.dataValues.country_code,
              newUser.dataValues.mobile_num,
              otp,
            );

        if (sendOtp) {
          return generalResponse(
            res,
            { newUser: true },
            "Otp Sent Successfully ",
            true,
            true,
          );
        } else {
          return generalResponse(
            res,
            { newUser: true },
            "Failed to send OTP",
            false,
            true,
          );
        }
      }
      if (type == "social") {
        const token = await generateToken({
          user_id: newUser.user_id,
          email: newUser.email,
          user_name: newUser.user_name,
          login_type: newUser.login_type,
        });
        return generalResponse(
          res,
          {
            token: token,
            user: newUser,
            newUser: true,
          },
          "User signed Up!!",
          true,
          true,
        );
      }
      return generalResponse(res, user, "SignUp Successfully!", true, true);
    } else {
      if (type == "social") {
        // allowedUpdateFields = ['email', 'full_name', 'user_name', 'country', 'login_type', 'device_token']
        let existingPlatform = isUser.platforms || [];

        if (!existingPlatform.includes(req.body.platform)) {
          existingPlatform.push(req.body.platform);
        }
        const updatePayload = { platforms: existingPlatform };
        if (req.body.voip_token) {
          updatePayload.voip_token = req.body.voip_token;
        }
        const updatedUser = await updateUser(updatePayload, {
          user_id: isUser.user_id,
        });
        const token = await generateToken({
          user_id: isUser.user_id,
          email: isUser.email,
          user_name: isUser.user_name,
          login_type: isUser.login_type,
        });

        const newUser = !(isUser.user_name ?? "").trim();

        return generalResponse(
          res,
          {
            token: token,
            user: isUser,
            newUser,
          },
          "User Already Exist! ",
          false,
          true,
        );
      }
      if (type == "email") {
        if (
          filteredData.email == "demo@reelboost.com" &&
          process.env.ISDEMO == "true"
        ) {
          isdemo = true;
          otp = "1234";
        }

        const sendOtp = isdemo ? true : await sendEmailOTP(req.body.email, otp);
        let existingPlatform = isUser.platforms || [];

        if (!existingPlatform.includes(req.body.platform)) {
          existingPlatform.push(req.body.platform);
        }

        updated = isdemo
          ? true
          : await (async () => {
              const updatePayload = { otp: otp, platforms: existingPlatform };
              if (req.body.voip_token) updatePayload.voip_token = req.body.voip_token;
              return await updateUser(updatePayload, { user_id: isUser.user_id });
            })();
        let newUser = false;
        // if (isUser.login_verification_status) {
        //     newUser = false
        // }
        if (!isUser.user_name || isUser.user_name.trim() === "") {
          newUser = true;
        }
        if (sendOtp && updated) {
          return generalResponse(
            res,
            { newUser: newUser },
            "Otp Sent Successfully",
            true,
            true,
          );
        }
        return generalResponse(
          res,
          {},
          "Failed to send on email ",
          false,
          true,
        );
      }
      if (type == "phone") {
        if (
          req.body.mobile_num == "1234567890" &&
          req.body.country_code == "+1" &&
          process.env.ISDEMO == "true"
        ) {
          isdemo = true;
          otp = "1234";
        }
        let sendOtp = false;
        let updated = false;
        let newUser = false;
        // if (isUser.login_verification_status && !isdemo) {
        //   newUser = false;
        // }

        if (!isUser.user_name || isUser.user_name.trim() === "") {
          newUser = true;
        }
        let existingPlatform = isUser.platforms || [];

        if (!existingPlatform.includes(req.body.platform)) {
          existingPlatform.push(req.body.platform);
        }

        sendOtp = isdemo
          ? true
          : await sendTwilioOTP(isUser.country_code, isUser.mobile_num, otp);
        updated = isdemo
          ? true
          : await (async () => {
              const updatePayload = { otp: otp, platforms: existingPlatform };
              if (req.body.voip_token) updatePayload.voip_token = req.body.voip_token;
              return await updateUser(updatePayload, { user_id: isUser.user_id });
            })();
        if (sendOtp && updated) {
          return generalResponse(
            res,
            { newUser: newUser },
            "Otp Sent Successfully ",
            true,
            true,
          );
        } else {
          return generalResponse(
            res,
            { newUser: newUser },
            "Failed to send OTP",
            false,
            true,
          );
        }
      }
      return generalResponse(res, "User Already Exist!", false, false);
    }
  } catch (error) {
    console.error("Error in SignUp", error);
    return generalResponse(
      res,
      {},
      "Something went wrong while Signin!",
      false,
      true,
    );
  }
}

async function OtpVerification(req, res) {
  try {
    const type = req.body.login_type;
    const otp = req.body.otp;
    if (otp == 0 || otp == "0") {
      return generalResponse(res, {}, "Otp not Verified", false, true, 400);
    }
    let isdemo = false;
    let allowedUpdateFields = [];
    let filteredData;
    if (type == "email") {
      if (
        req.body.email == "demo@reelboost.com" &&
        process.env.ISDEMO == "true"
      ) {
        isdemo = true;
      }
      allowedUpdateFields = ["email", "otp"];
    } else if (type == "phone") {
      if (
        req.body.mobile_num == "1234567890" &&
        req.body.country_code == "+1" &&
        process.env.ISDEMO == "true"
      ) {
        isdemo = true;
      }
      allowedUpdateFields = ["mobile_num", "otp", "country_code"];
    }

    try {
      filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);
    } catch (err) {
      console.log(err);

      return generalResponse(
        res,
        { success: false },
        "Data is Missing",
        false,
        true,
      );
    }

    const isVerified = await verifyOtp(filteredData, isdemo);
    if (isVerified) {
      const token = await generateToken({ user_id: isVerified.user_id });
      return generalResponse(
        res,
        {
          token,
          user: isVerified,
        },

        "Otp Verified Successfully",
        true,
        false,
      );
    } else {
      return generalResponse(
        res,
        { success: false },
        "Otp not Viryfied",
        false,
        true,
      );
    }
  } catch (err) {
    console.log(err);
    return generalResponse(
      res,
      {},
      "Something went wrong while OTP Verification",
      false,
      true,
    );
  }
}

module.exports = {
  signupUser,
  OtpVerification,
};
