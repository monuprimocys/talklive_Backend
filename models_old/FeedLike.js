module.exports = (sequelize, DataTypes) => {
  const FeedLike = sequelize.define("FeedLike", {
    feed_like_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  });

  FeedLike.associate = function (models) {
    FeedLike.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedLike.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
  };

  return FeedLike;
};
