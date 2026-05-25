module.exports = (sequelize, DataTypes) => {
    const Call = sequelize.define("Call", {
      call_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      call_type: {
        type: DataTypes.ENUM(
          "audio",
          "video"
        ),
        allowNull: false,
      },
      call_status: {
        type: DataTypes.ENUM(
          "rejected",
          "missed",
          "ongoing",
          "ringing",
          "ended"
        ),
        allowNull: false,
      },
      call_duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      users: {
        type: DataTypes.ARRAY(DataTypes.DECIMAL),
        allowNull: false,
        defaultValue: [],
      },
      current_users:{
        type: DataTypes.ARRAY(DataTypes.DECIMAL),
        allowNull: false,
        defaultValue: [],
      },
      room_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
        indexes: [
            { fields: ["chat_id"], name: "idx_call_chat" },
            { fields: ["user_id"], name: "idx_call_user" },
        ]
    });

    Call.associate = function (models) {
        Call.belongsTo(models.Message, {
            foreignKey: "message_id",
            onDelete: 'CASCADE'
        });
        Call.belongsTo(models.Chat, {
            foreignKey: "chat_id",
            onDelete: 'CASCADE'
        })
        Call.hasMany(models.Message, {
            foreignKey: "call_id",
            onDelete: 'CASCADE',
        })
        Call.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: 'CASCADE',
            as: "caller"
        })
    };

    return Call;
}