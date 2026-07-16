module.exports = (sequelize, DataTypes) => {
  const Feed = sequelize.define("Feed", {
    feed_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    feed_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "text",
      validate: {
        isIn: [
          ["text", "text_image", "text_video", "image_only", "video_only"],
        ],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
      comment: "Text content of the feed post",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      comment: "Location information for the feed post",
    },
    hashtags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: "Array of hashtags in the content",
    },
    mentioned_users: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
      comment: "Array of user IDs mentioned in the post (@user)",
    },
    allow_comments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Toggle to allow/disallow comments on this post",
    },
    total_likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total number of likes on this feed post",
    },
    total_comments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total number of comments on this feed post",
    },
    total_shares: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total number of shares of this feed post",
    },
    total_saves: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Total number of saves of this feed post",
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Post visibility status (active/inactive)",
    },
    deleted_by_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Soft delete flag",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when post was deleted",
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
  });

  Feed.associate = function (models) {
    // Feed belongs to User
    Feed.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    // Feed can have multiple media files (images/videos)
    Feed.hasMany(models.FeedMedia, {
      foreignKey: "feed_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
      as: "media",
    });

    // Feed can have multiple likes
    Feed.hasMany(models.FeedLike, {
      foreignKey: "feed_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    // Feed can have multiple comments
    Feed.hasMany(models.FeedComment, {
      foreignKey: "feed_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    // Feed can have multiple saves
    Feed.hasMany(models.FeedSave, {
      foreignKey: "feed_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    // Feed can have tagged users
    Feed.hasMany(models.FeedTaggedUser, {
      foreignKey: "feed_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
      as: "tagged_users",
    });

    // Feed can have multiple reports
    Feed.hasMany(models.FeedReport, {
      foreignKey: "feed_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

     Feed.hasMany(models.Notification, {
      foreignKey: "feed_id",
      as: "notifications",
      onDelete: "CASCADE",
    });

     Feed.hasMany(models.FeedPin, {
      foreignKey: "feed_id",
      onDelete: "CASCADE",
    });
  };

  return Feed;
};
