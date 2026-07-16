module.exports = (sequelize, DataTypes) => {
  const Coin_to_coin = sequelize.define("Coin_to_coin", {
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    coin: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    success: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },

    gift_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    transaction_ref: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "", // live, social, battle
    },

    story_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    feed_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  Coin_to_coin.associate = function (models) {
    Coin_to_coin.belongsTo(models.User, {
      as: "sender",
      foreignKey: "sender_id",
      onDelete: "CASCADE",
    });

    Coin_to_coin.belongsTo(models.User, {
      as: "reciever",
      foreignKey: "reciever_id",
      onDelete: "CASCADE",
    });

    Coin_to_coin.belongsTo(models.Gift, {
      foreignKey: "gift_id",
      onDelete: "CASCADE",
    });

    Coin_to_coin.belongsTo(models.Social, {
      foreignKey: "social_id",
      onDelete: "CASCADE",
    });

    // ✅ IMPORTANT: Coin → Live
    Coin_to_coin.belongsTo(models.Live, {
      foreignKey: "live_id",
      onDelete: "CASCADE",
    });

    Coin_to_coin.belongsTo(models.Story, {
      foreignKey: "story_id",
    });
    
    Coin_to_coin.belongsTo(models.Feed, {
      foreignKey: "feed_id",
    });
  };

  return Coin_to_coin;
};
