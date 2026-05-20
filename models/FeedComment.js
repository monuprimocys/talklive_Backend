module.exports = (sequelize, DataTypes) => {
  const FeedComment = sequelize.define("FeedComment", {
    feed_comment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
      comment: 'Text content of the comment',
    },
    mentioned_users: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of user IDs mentioned in comment',
    },
    total_likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of likes on this comment',
    },
    parent_comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of parent comment if this is a reply',
    },
  });

  FeedComment.associate = function (models) {
    FeedComment.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedComment.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      onDelete: 'CASCADE'
    });
    FeedComment.hasMany(models.FeedCommentLike, {
      foreignKey: "feed_comment_id",
      onDelete: 'CASCADE'
    });
  };

  return FeedComment;
};
