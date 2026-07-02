module.exports = (sequelize, DataTypes) => {
  const SocialPin = sequelize.define("SocialPin", {
    pin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    social_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pin_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  SocialPin.associate = function (models) {
    SocialPin.belongsTo(models.User, {
      foreignKey: "pin_by",
    });

    SocialPin.belongsTo(models.Social, {
      foreignKey: "social_id",
    });
  };

  return SocialPin;
};