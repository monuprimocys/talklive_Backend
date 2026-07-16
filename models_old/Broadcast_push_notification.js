module.exports = (sequelize, DataTypes) => {
  const Broadcast_push_notification = sequelize.define("Broadcast_push_notification", {
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },

   
  });



  return Broadcast_push_notification;
}