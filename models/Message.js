const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message_content: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
      get() {
        const message_type = this.getDataValue("message_type");
        const rawValue = this.getDataValue("message_content");
        const isDeleted = this.getDataValue("deleted_for_everyone");

        if (isDeleted) return "This message was deleted.";
        if (rawValue === "This message was deleted.") return rawValue;

        if (["image", "video", "gif", "doc"].includes(message_type)) {
          return formatMediaUrl(
            rawValue,
            "uploads/not-found-images/group-image.png",
          );
        }
        return rawValue;
      },
    },

    message_thumbnail: {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: false,
      get() {
        const message_type = this.getDataValue("message_type");
        const rawValue = this.getDataValue("message_thumbnail");

        if (message_type === "video") {
          return formatMediaUrl(
            rawValue,
            "uploads/not-found-images/group-image.png",
          );
        }
        return rawValue;
      },
    },
    message_length: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    message_seen_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "sent",
    },
    message_size: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    reply_to: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for messages that are not replies
      onDelete: "CASCADE", // Optional: Delete replies if the parent message is deleted
      get() {
        const reply = this.getDataValue("reply_to");
        if (reply === null) {
          return 0;
        }
      },
    },
    social_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for messages that are not replies
      onDelete: "CASCADE", // Optional: Delete replies if the parent message is deleted
      get() {
        const social = this.getDataValue("social_id");
        if (social === null) {
          return 0;
        }
      },
    },

    story_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "CASCADE",
      get() {
        const story = this.getDataValue("story_id");
        return story === null ? 0 : story;
      },
    },

    gift_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    story_type_content: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    deleted_for: {
      type: DataTypes.ARRAY(DataTypes.DECIMAL),
      allowNull: true,
      defaultValue: [], // Array of user_ids who deleted the message
    },
    deleted_for_everyone: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    unsend_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  });

  // sender_id
  // chat_id
  // socila_id
  Message.associate = (models) => {
    Message.belongsTo(models.Message, {
      as: "ParentMessage",
      foreignKey: "reply_to",
      targetKey: "message_id",
    });
    Message.belongsTo(models.User, {
      foreignKey: "sender_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Chat, {
      foreignKey: "chat_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Call, {
      foreignKey: "call_id",
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Social, {
      foreignKey: "social_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Story, {
      foreignKey: "story_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    Message.hasMany(models.Message, {
      as: "Replies",
      foreignKey: "reply_to",
    });
    Message.hasMany(models.Message_seen, {
      foreignKey: "message_id",
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Gift, {
      foreignKey: "gift_id",
    });
  };

  return Message;
};
