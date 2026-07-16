module.exports = (sequelize, DataTypes) => {
  const Language = sequelize.define("Language", {
    language_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language_alignment: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue:true
    },
    default_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue:false
    },
    // Dynamic colums .....
  });

  return Language;
};