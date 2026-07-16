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
  sendWelcomeEmail,
} = require("../../service/common/otp.service");
const { generateToken } = require("../../service/common/token.service");
const filterData = require("../../helper/filter.helper");
const {
  gettransaction_conf,
} = require("../../service/repository/Transactions/transaction_conf.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createNotification } = require("../../service/repository/notification.service");
const crypto = require("crypto");

async function generateUniqueUsername(email) {
  let baseUsername = "";

  if (email) {
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
  }

  if (!baseUsername) {
    baseUsername = "user";
  }

  let username = baseUsername;
  let counter = 1;

  while (await getUser({ user_name: username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}


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
      allowedUpdateFields = ["email", "login_type"];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);

        if (req.body.device_token) {
          filteredData.device_token = req.body.device_token;
        }

        if (req.body.voip_token) {
          filteredData.voip_token = req.body.voip_token;
        }
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
        // "voip_token",
      ];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);

        if (req.body.voip_token) {
          filteredData.voip_token = req.body.voip_token;
        }

        if (req.body.device_token) {
          filteredData.device_token = req.body.device_token;
        }
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
        // "device_token",
        "first_name",
        "last_name",
        // "voip_token",
        //  "profile_pic"
      ];
      try {
        filteredData = updateFieldsFilter(req.body, allowedUpdateFields, true);

        // Optional fields
        if (req.body.device_token) {
          filteredData.device_token = req.body.device_token;
        }

        if (req.body.voip_token) {
          filteredData.voip_token = req.body.voip_token;
        }

        if (req.body.profile_pic) {
          filteredData.profile_pic = req.body.profile_pic;
        }

        if (req.body.full_name) {
          filteredData.full_name = req.body.full_name;
        }

        //         if (req.body.profile_pic) {
        //   filteredData.profile_pic = req.body.profile_pic;
        // }
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

      // New user: platforms array starts with just the current login platform
      filteredData.platforms = [req.body.platform];

      // console.log("filteredData:", filteredData);

      if (!filteredData.user_name) {
        filteredData.user_name = await generateUniqueUsername(filteredData.email);
      }
      const newUser = await createUser(filteredData);

      // console.log("newUser.device_token:", newUser.device_token);

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

        await sendWelcomeEmail(
          newUser.email,
          newUser.first_name || "User"
        );


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

        if (newUser.device_token) {
          await sendPushNotification({
            playerIds: [newUser.device_token],
            title: "Welcome to TokLive 🎉",
            message: "Your stage starts now. Start exploring and create your first video!",
            data: { type: "welcome" },
          });
        }

        // In-App Notification
        await createNotification({
          notification_title: "Welcome to TokLive",
          notification_type: "Welcome",
          sender_id: newUser.user_id,
          reciever_id: newUser.user_id,
          notification_description: {
            description: "Welcome to TokLive! Your stage starts now.",
            user_id: newUser.user_id,
          },
        });
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

        if (!isUser.user_name || !isUser.user_name.trim()) {
          const username = await generateUniqueUsername(isUser.email);
          await updateUser(
            { user_name: username },
            { user_id: isUser.user_id }
          );

          isUser.user_name = username;
        }

        // Always store only the current (last) login platform - no accumulation
        const updatePayload = { platforms: [req.body.platform] };
        if (req.body.voip_token) {
          updatePayload.voip_token = req.body.voip_token;
        }

        if (req.body.profile_pic) {
          updatePayload.profile_pic = req.body.profile_pic;
        }

        if (req.body.device_token) {
          updatePayload.device_token = req.body.device_token;
        }

        if (req.body.full_name) {
          updatePayload.full_name = req.body.full_name;
        }

        // const updatedUser = await updateUser(updatePayload, {
        //   user_id: isUser.user_id,
        // });
        // const token = await generateToken({
        //   user_id: isUser.user_id,
        //   email: isUser.email,
        //   user_name: isUser.user_name,
        //   login_type: isUser.login_type,
        // });

        // const newUser = !(isUser.user_name ?? "").trim();

        await updateUser(updatePayload, {
          user_id: isUser.user_id,
        });

        const updatedUser = await getUser({
          user_id: isUser.user_id,
        });

        const token = await generateToken({
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          user_name: updatedUser.user_name,
          login_type: updatedUser.login_type,
        });

        const newUser = !(isUser.user_name ?? "").trim();

        return generalResponse(
          res,
          {
            token: token,
            // user: isUser,
            user: updatedUser,
            newUser,
          },
          "User Already Exist! ",
          true,
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

        let updated = false;

        if (!isUser.user_name || !isUser.user_name.trim()) {
          const username = await generateUniqueUsername(isUser.email);

          await updateUser(
            { user_name: username },
            { user_id: isUser.user_id }
          );

          isUser.user_name = username;
        }

        const sendOtp = isdemo ? true : await sendEmailOTP(req.body.email, otp);

        //        await sendWelcomeEmail(
        //   newUser.email,
        //   newUser.first_name || "User"
        // );

        updated = isdemo
          ? true
          : await (async () => {
            // Always store only the current (last) login platform - no accumulation
            const updatePayload = { otp: otp, platforms: [req.body.platform] };
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


        //         if (!isUser.user_name || !isUser.user_name.trim()) {
        //   const username = await generateUniqueUsername();

        //   await updateUser(
        //     { user_name: username },
        //     { user_id: isUser.user_id }
        //   );  

        //   isUser.user_name = username;
        // }

        sendOtp = isdemo
          ? true
          : await sendTwilioOTP(isUser.country_code, isUser.mobile_num, otp);
        updated = isdemo
          ? true
          : await (async () => {
            // Always store only the current (last) login platform - no accumulation
            const updatePayload = { otp: otp, platforms: [req.body.platform] };
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
    console.error(error.stack);
    return generalResponse(
      res,
      {},
      // "Something went wrong while Signin!",
      error.message,
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
