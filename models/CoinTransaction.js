module.exports = (sequelize, DataTypes) => {
  const CoinTransaction = sequelize.define("CoinTransaction", {
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
    },
    transaction_type: {
      type: DataTypes.ENUM("MESSAGE", "VOICE_CALL", "VIDEO_CALL"),
      allowNull: false,
    },
    coins_deducted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "REFUNDED", "FAILED"),
      defaultValue: "PENDING",
    },
    call_duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return CoinTransaction;
};
