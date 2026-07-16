module.exports = (sequelize, DataTypes) => {
  const Level = sequelize.define("Level", {
    level_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    level_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    level_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    required_coins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    badge: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return Level;
};