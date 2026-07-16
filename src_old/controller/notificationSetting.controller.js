const {
  updateSettings,
  getOrCreateSettings,
} = require("../service/repository/notificationSetting.service");

const { generalResponse } = require("../helper/response.helper");

// GET SETTINGS
const getNotificationSettings = async (req, res) => {
  try {
    const user_id = req.authData.user_id;

    const settings = await getOrCreateSettings(user_id);

    return generalResponse(
      res,
      settings,
      "Notification settings fetched successfully",
      true,
      false,
      200
    );
  } catch (error) {
    console.log(error);
    return generalResponse(res, {}, "Something went wrong", false, true, 500);
  }
};

// UPDATE SETTINGS
const updateNotificationSettings = async (req, res) => {
  try {
    const user_id = req.authData.user_id;

    const payload = {
      post_likes: req.body.post_likes,
      comments_on_post: req.body.comments_on_post,
      follow: req.body.follow,
      mentions: req.body.mentions,
      gifts_received: req.body.gifts_received,
      chat_message: req.body.chat_message,

      // ✅ ADD THESE
      who_can_see_posts: req.body.who_can_see_posts,
      show_followings: req.body.show_followings,
      show_chat_button: req.body.show_chat_button,
    };

    // ✅ remove undefined fields (VERY IMPORTANT)
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const updated = await updateSettings(user_id, payload);

    return generalResponse(
      res,
      updated,
      "Notification settings updated successfully",
      true,
      false,
      200
    );
  } catch (error) {
    console.log(error);
    return generalResponse(res, {}, "Something went wrong", false, true, 500);
  }
};

// ✅ IMPORTANT EXPORT (COMMONJS ONLY)
module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
};