module.exports = (sequelize, DataTypes) => {
  const FeedTaggedUser = sequelize.define("FeedTaggedUser", {
    feed_tagged_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    mention_type: {
      type: DataTypes.ENUM('content', 'media_tag'),
      allowNull: false,
      defaultValue: 'content',
      comment: 'Type of mention: in content (@user) or tagged in media',
    },
  });

  FeedTaggedUser.associate = function (models) {
    FeedTaggedUser.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedTaggedUser.belongsTo(models.User, {
      foreignKey: "tagged_user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
  };

  return FeedTaggedUser;
};
