module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define("Plan", {
    plan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plan_type: {
      type: DataTypes.ENUM("monthly", "yearly", "lifetime"),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // RevenueCat fields
    revenuecat_product_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_type: {
      type: DataTypes.ENUM("subscription", "consumable", "lifetime"),
      allowNull: false,
      defaultValue: "subscription",
    },
    platform: {
      type: DataTypes.ENUM("ios", "android", "both"),
      allowNull: false,
      defaultValue: "both",
    },
    is_revenuecat_managed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: "plans",
    timestamps: true,
    indexes: [
      { fields: ["revenuecat_product_id"], unique: true, name: "plans_revenuecat_product_id_uidx" },
    ],
  });

  Plan.associate = function (models) {
    Plan.hasMany(models.Subscription, {
      foreignKey: "plan_id",
      as: "subscriptions",
    });
  };

  return Plan;
};