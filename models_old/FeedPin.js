module.exports = (sequelize, DataTypes) => {
  const FeedPin = sequelize.define("FeedPin", {
    pin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    feed_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pin_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  FeedPin.associate = function (models) {
    FeedPin.belongsTo(models.User, {
      foreignKey: "pin_by",
    });

    FeedPin.belongsTo(models.Feed, {
      foreignKey: "feed_id",
    });
  };

  return FeedPin;
};