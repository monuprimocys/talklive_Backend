const { sendVoipNotification } = require("../service/voipService");
const { getUser } = require("../service/repository/user.service");

exports.sendIncomingCall = async (req, res) => {
  try {
    const { userId, caller_id, caller_name } = req.body;

    // Get user from database to fetch voip_token
    const user = await getUser(
      { user_id: userId },
      false,
      false,
      ["user_id", "voip_token", "platforms"]
    );
    if (!user || !user.voip_token) {
      return res.status(400).json({
        success: false,
        message: "User not found or no VOIP token available",
      });
    }

    const deviceToken = user.voip_token;

    const result = await sendVoipNotification({
      deviceToken,
      callerId: caller_id,
      callerName: caller_name,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("VoIP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};