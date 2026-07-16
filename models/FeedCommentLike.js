module.exports = (sequelize, DataTypes) => {
  const FeedCommentLike = sequelize.define("FeedCommentLike", {
    feed_comment_like_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  });

  FeedCommentLike.associate = function (models) {
    FeedCommentLike.belongsTo(models.FeedComment, {
      foreignKey: "feed_comment_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedCommentLike.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
  };

  return FeedCommentLike;
};
