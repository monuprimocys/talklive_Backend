const jwt = require("jsonwebtoken");
const user_service = require("../service/repository/user.service");
const admin_service = require("../service/repository/Admin.service");
const { generalResponse } = require("../helper/response.helper");
const {
  getParticipantWithoutPagenation,
} = require("../service/repository/Participant.service");
const { User } = require("../../models");
const { emitEvent } = require("../service/common/socket.service");
const filterData = require("../helper/filter.helper");
const {
  initial_onlineList,
} = require("../controller/chat_controller/Message.controller");


async function authMiddleware(req, res, next) {  
  if (!req.headers.authorization) {
    return res
      .status(403)
      .json({ success: false, error: "No credentials sent!" });
  } else {
    if (req.headers.authorization.split(" ")[0] !== "Bearer") {
      return res.status(401).json({ success: false, error: "Invalid token!" });
    }

    try {
      // check if the token is valid or not
      req.authData = jwt.verify(
        req.headers.authorization.split(" ")[1], // auth token
        process.env.screteKey
      );
      
      if (req?.authData?.user_id) {
        
        let isUser = await user_service.getUser({ user_id: req.authData.user_id, is_deleted : false} ,false ,true);
        if (!isUser) {
          return generalResponse(res, {}, "No User found", false, true, 401);
        }
        req.userData = isUser.toJSON();
        req.user_type = "user";

      }
      if (req?.authData?.admin_id) {
        let is_admin = await admin_service.getAdmin({ admin_id: req.authData.admin_id });
        
        if (!is_admin) {
          return generalResponse(res, {}, "No Admin found", false, true, 401);
        }
        req.adminData = is_admin.toJSON();
        req.user_type = "admin";
      }
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: "Invalid token!", success: false });
    }
  }
  next();
}


const soketAuthMiddleware = async (socket, next) => {
  // Retrieve the token from the headers
  const authToken = socket.handshake.headers["token"] || socket.handshake.auth.token;

  
  if (!authToken) {
    
    return next(new Error("Missing token during connection."));
  }

  try {
    const jwtSecretKey = process.env.screteKey; // Ensure the environment variable is correctly set
    // Verify the token and decode the user data
    const authData = jwt.verify(authToken, jwtSecretKey);
    
    // Initialize authData on the socket
    socket.authData = { user_id: authData.user_id };

    // Fetch the user from the database
    const isUser = await user_service.getUser({
      user_id: socket.authData.user_id,
    });
    
    if (!isUser) {
      return next(new Error("User not found."));
    }
    attributes = [
      "profile_pic",
      "user_id",
      "full_name",
      "user_name",
      "email",
      "country_code",
      "country",
      "gender",
      "bio",
      "profile_verification_status",
      "login_verification_status",
      "socket_id",
    ];
    let user_data = { ...isUser.toJSON() };
    const keysToRemove = [
      "password",
      "otp",
      "id_proof",
      "selfie",
      "device_token",
    ];
    keysToRemove.forEach((key) => {
      user_data = filterData(user_data, key, "key");
    });
    user_data.isOnline = true
    await user_service.updateUser(
      { socket_id: socket.id },
      { user_id: socket.authData.user_id }
    );
    const includeOptions = [
      {
        model: User,
        as: "User",
        attributes: [
          "profile_pic",
          "user_id",
          "full_name",
          "user_name",
          "email",
          "country_code",
          "country",
          "gender",
          "bio",
          "profile_verification_status",
          "login_verification_status",
          "socket_id",
        ],
      },
    ];
    const getChats_of_users = await getParticipantWithoutPagenation({
      user_id: socket.authData.user_id,
    });
    if (getChats_of_users.Records.length > 0) {
      getChats_of_users.Records.map((chats) => {
        return chats.chat_id;
      }).forEach(async (element) => {
        let users = await getParticipantWithoutPagenation(
          { chat_id: element },
          includeOptions
        );
        users.Records.map((chats) => {
          if (
            chats.user_id != socket.authData.user_id
          )

          emitEvent(
            chats.User.socket_id,
            "online_user",
            user_data
          );
        });
      });
    }

    initial_onlineList(socket, emitEvent);
    // Allow the connection to proceed
    next();
  } catch (error) {
    console.error("Token verification or user handling error:", error);
    return next(new Error("Invalid token."));
  }
};



async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 👉 Agar token hi nahi hai → guest user
    if (!authHeader) {
      req.authData = null;
      req.user_type = "guest";
      return next();
    }

    // 👉 Format check (Bearer token)
    if (authHeader.split(" ")[0] !== "Bearer") {
      req.authData = null;
      req.user_type = "guest";
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.screteKey);
      req.authData = decoded;

      // ✅ USER CHECK
      if (decoded?.user_id) {
        const isUser = await user_service.getUser(
          { user_id: decoded.user_id, is_deleted: false },
          false,
          true
        );

        if (isUser) {
          req.userData = isUser.toJSON();
          req.user_type = "user";
        } else {
          req.user_type = "guest";
        }
      }

      // ✅ ADMIN CHECK
      if (decoded?.admin_id) {
        const isAdmin = await admin_service.getAdmin({
          admin_id: decoded.admin_id,
        });

        if (isAdmin) {
          req.adminData = isAdmin.toJSON();
          req.user_type = "admin";
        } else {
          req.user_type = "guest";
        }
      }
    } catch (err) {
      // ❗ Token invalid → ignore (no block)
      console.warn("Optional auth failed:", err.message);
      req.authData = null;
      req.user_type = "guest";
    }

    next();
  } catch (error) {
    console.error("optionalAuthMiddleware error:", error);
    next(); // never block
  }
}

module.exports = { authMiddleware, soketAuthMiddleware , optionalAuthMiddleware };
