module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    notification_title: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    notification_description: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    notification_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    view_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unseen",
    },

   
  });
  Notification.associate = function (models) {
    Notification.belongsTo(models.User, {
      foreignKey: "sender_id",
      as: "notification_sender",
      allowNull: true,
      onDelete: 'CASCADE'
    })
    Notification.belongsTo(models.User, {
      foreignKey: "reciever_id",
      as: "notification_reciever",
      allowNull: true,
      onDelete: 'CASCADE'
    })
    Notification.belongsTo(models.Social, {
      foreignKey: "social_id",
      allowNull: true,
      onDelete: 'CASCADE'
    })
    Notification.belongsTo(models.Gift, {
      foreignKey: "gift_id",
      allowNull: true,
      onDelete: 'CASCADE'
    })

  }
  return Notification;
}