module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define("Subscription", {
    subscription_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Users", key: "user_id" },
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "plans", key: "plan_id" },
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "expired",
        "canceled",
        "billing_issue",
        "paused"
      ),
      defaultValue: "active",
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // RevenueCat fields
    revenuecat_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    original_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    platform: {
      type: DataTypes.ENUM("ios", "android", "unknown"),
      allowNull: true,
    },
    renewal_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    entitlement_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    webhook_event_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "subscriptions",
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["original_transaction_id"] },
      { fields: ["webhook_event_id"] },
    ],
  });

  Subscription.associate = function (models) {
    Subscription.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    Subscription.belongsTo(models.Plan, {
      foreignKey: "plan_id",
      as: "plan",
    });
  };

  return Subscription;
};