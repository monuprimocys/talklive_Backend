const db = require("../../models");

/**
 * Get user's current level number
 * @param {number} user_id
 * @returns {Promise<number>}
 */
async function getUserLevel(user_id) {
  try {
    if (!user_id) {
      return 1;
    }

    const user = await db.User.findOne({
      where: { user_id },
      attributes: ["available_coins"],
    });

    if (!user) {
      return 1;
    }

    const levels = await db.Level.findAll({
      where: { status: true },
      order: [["level_number", "ASC"]],
      attributes: ["level_number", "required_coins"],
    });

    if (!levels.length) {
      return 1;
    }

    let levelNumber = 1;

    for (let i = 0; i < levels.length; i++) {
      const minCoins = i === 0 ? 0 : levels[i - 1].required_coins + 1;
      const maxCoins = levels[i].required_coins;

      if (
        user.available_coins >= minCoins &&
        user.available_coins <= maxCoins
      ) {
        levelNumber = levels[i].level_number;
        break;
      }
    }

    // If coins are greater than last level
    if (
      user.available_coins >
      levels[levels.length - 1].required_coins
    ) {
      levelNumber = levels[levels.length - 1].level_number;
    }

    return levelNumber;
  } catch (error) {
    console.error("Error getting user level:", error);
    return 1;
  }
}

/**
 * Add level_number to single user
 */
async function addLevelToUser(userRecord) {
  if (!userRecord) return userRecord;

  const level_number = await getUserLevel(userRecord.user_id);

  return {
    ...(userRecord.toJSON ? userRecord.toJSON() : userRecord),
    level_number,
  };
}

/**
 * Add level_number to multiple users
 */
async function addLevelToUsers(userRecords) {
  if (!userRecords || userRecords.length === 0) {
    return userRecords;
  }

  return Promise.all(userRecords.map(addLevelToUser));
}

module.exports = {
  getUserLevel,
  addLevelToUser,
  addLevelToUsers,
};