module.exports = (sequelize, DataTypes) => {
  const Story = sequelize.define("Story", {
    story_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    total_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    allow_replies: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    music_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  Story.associate = function (models) {
    Story.belongsTo(models.User, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
    });

    Story.hasMany(models.StoryMedia, {
      foreignKey: "story_id",
      as: "media",
      onDelete: "CASCADE",
    });

    Story.hasMany(models.StoryView, {
      foreignKey: "story_id",
      onDelete: "CASCADE",
    });

    Story.hasMany(models.Message, {
      foreignKey: "story_id",
    });

    // Music relation (optional)
    Story.belongsTo(models.Music, {
      foreignKey: "music_id",
      as: "music",
    });
  };

  return Story;
};
