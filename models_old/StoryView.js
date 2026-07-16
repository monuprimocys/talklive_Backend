module.exports = (sequelize, DataTypes) => {
  const StoryView = sequelize.define("StoryView", {
    story_view_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    story_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ["story_id", "user_id"],
      },
    ],
  });

  StoryView.associate = function (models) {
    StoryView.belongsTo(models.Story, { foreignKey: "story_id", onDelete: "CASCADE" });
    StoryView.belongsTo(models.User, { foreignKey: "user_id", onDelete: "CASCADE" });
  };

  return StoryView;
};
