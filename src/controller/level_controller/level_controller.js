const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { Level, User } = require("../../../models");

async function getLevels(req, res) {
  try {
    const user_id = req.authData.user_id;

    const user = await User.findByPk(user_id, {
      attributes: ["user_id", "available_coins"],
    });

    if (!user) {
      return generalResponse(res, {}, "User not found", false, false, 404);
    }

    const levels = await Level.findAll({
      where: { status: true },
      order: [["level_number", "ASC"]],
    });

    const response = levels.map((level, index) => {
  const previousCoins =
    index === 0 ? 0 : levels[index - 1].required_coins + 1;

  return {
    level_id: level.level_id,
    level_name: level.level_name,
    level_number: level.level_number,
    required_coins: level.required_coins,
    badge: level.badge,
    is_current:
      user.available_coins >= previousCoins &&
      user.available_coins <= level.required_coins,
    is_unlocked: user.available_coins >= level.required_coins,
  };
});

    return generalResponse(
      res,
      {
        available_coins: user.available_coins,
        levels: response,
      },
      "Levels fetched successfully",
      true,
      false,
      200,
    );
  } catch (error) {
    console.log(error);

    return generalResponse(res, {}, "Something went wrong", false, false, 500);
  }
}

module.exports = {
  getLevels,
};