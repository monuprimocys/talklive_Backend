module.exports = (sequelize, DataTypes) => {
  const UserNotificationSetting = sequelize.define(
    "UserNotificationSetting",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      post_likes: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      comments_on_post: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      follow: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      mentions: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      gifts_received: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      chat_message: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // ✅ NEW FIELDS

      who_can_see_posts: {
        type: DataTypes.STRING, // ✅ FIX
        defaultValue: "everyone",
        validate: {
          isIn: [["everyone", "followers"]],
        },
      },

      show_followings: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      show_chat_button: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "user_notification_settings",
    }
  );

  UserNotificationSetting.associate = function (models) {
    UserNotificationSetting.belongsTo(models.User, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
    });
  };

  return UserNotificationSetting;
};