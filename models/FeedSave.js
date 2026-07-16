module.exports = (sequelize, DataTypes) => {
  const FeedSave = sequelize.define("FeedSave", {
    feed_save_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  });

  FeedSave.associate = function (models) {
    FeedSave.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedSave.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
  };

  return FeedSave;
};
