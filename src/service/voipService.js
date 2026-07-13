
const http2 = require("http2");
const config = require("../../config/voipConfig");
const generateVoipToken = require("../helper/apnsToken");

const APN_URL = config.production
  ? "https://api.push.apple.com"
  : "https://api.sandbox.push.apple.com";

exports.sendVoipNotification = async ({
 deviceToken,
  callerId,
  callerName,
  callData,
  userData,
  chatData,
}) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("🚀 Sending VOIP...");
      console.log("Device Token:", deviceToken);
      console.log("Caller:", callerName);

      // ✅ 1. Connect to APNS
      const client = http2.connect(APN_URL);

      client.on("error", (err) => {
        console.error("❌ HTTP2 CONNECTION ERROR:", err);
      });

      // ✅ 2. Generate JWT Token
      const token = generateVoipToken();
      console.log("🔑 APNS TOKEN GENERATED");

      // ✅ 3. Create request
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${deviceToken}`,
        authorization: `bearer ${token}`,
        "apns-topic": `${config.bundleId}.voip`, // ⚠️ MUST MATCH iOS bundle
        "apns-push-type": "voip",
        "apns-priority": "10",
      });

      // ✅ 4. Payload
      const payload = JSON.stringify({
        aps: {
          alert: {
            title: "Incoming Call",
            body: `${callerName} is calling...`,
          },
          "content-available": 1,
        },

        uuid: Date.now().toString(),

        call: {
          call_id: callData.call_id,
          room_id: callData.room_id,
          session_id: callData.session_id || "",
          call_type: callData.call_type,
          chat_id: callData.chat_id,
          peer_id: callerId,
          current_users: callData.current_users?.length || 1,
          start_time: new Date().toISOString(),
        },

        user: {
          user_id: userData.user_id,
          user_name: userData.user_name,
          full_name: userData.full_name,
          profile_pic: userData.profile_pic,
        },

        chat: {
          chat_id: chatData.chat_id,
          chat_name: chatData.chat_name || chatData.group_name || callerName,
          group_name: chatData.group_name || null,
          is_private: chatData.chat_type === "private",
        },

        voip: {
          push_type: "voip",
          priority: "high",
          ttl: 30,
        },
      });

      let responseData = "";

      // ✅ 5. Response headers
      req.on("response", (headers) => {
        console.log("📩 APNS STATUS:", headers[":status"]);
        console.log("📩 APNS HEADERS:", headers);
      });

      // ✅ 6. Response body (VERY IMPORTANT)
      req.on("data", (chunk) => {
        responseData += chunk;
      });

      // ✅ 7. End response
      req.on("end", () => {
        console.log("📦 APNS RESPONSE BODY:", responseData);

        if (responseData) {
          try {
            const parsed = JSON.parse(responseData);
            console.log("❌ APNS ERROR REASON:", parsed.reason);
          } catch (e) { }
        }

        client.close();
        resolve(responseData);
      });

      // ✅ 8. Error handling
      req.on("error", (err) => {
        console.error("❌ REQUEST ERROR:", err);
        client.close();
        reject(err);
      });

      // ✅ 9. Send request
      req.write(payload);
      req.end();

    } catch (error) {
      console.error("❌ VOIP FUNCTION ERROR:", error);
      reject(error);
    }
  });
};