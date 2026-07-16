const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
  const StoryMedia = sequelize.define("StoryMedia", {
    story_media_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return formatMediaUrl(this.getDataValue("media_url"));
      },
    },
    media_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "image",
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
      get() {
        return formatMediaUrl(this.getDataValue("thumbnail_url"));
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  StoryMedia.associate = function (models) {
    StoryMedia.belongsTo(models.Story, {
      foreignKey: "story_id",
      allowNull: false,
      onDelete: "CASCADE",
    });
  };

  return StoryMedia;
};
