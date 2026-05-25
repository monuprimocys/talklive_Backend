const { UserNotificationSetting } = require("../../../models");

const getOrCreateSettings = async (user_id) => {
  let settings = await UserNotificationSetting.findOne({
    where: { user_id },
  });

  if (!settings) {
    settings = await UserNotificationSetting.create({ user_id });
  }

  return settings;
};

// UPDATE SETTINGS
const updateSettings = async (user_id, payload) => {
  const settings = await getOrCreateSettings(user_id);

  await settings.update(payload);

  return settings;
};

module.exports = {
  getOrCreateSettings,
  updateSettings,
};