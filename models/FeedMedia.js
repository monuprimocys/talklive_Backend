const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
  const FeedMedia = sequelize.define("FeedMedia", {
    feed_media_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL path to the media file (image or video)',
      get() {
        return formatMediaUrl(this.getDataValue("media_url"));
      },
    },
    media_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'image',
      validate: {
        isIn: [['image', 'video']]
      }
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Thumbnail URL for video media',
      get() {
        return formatMediaUrl(this.getDataValue("thumbnail_url"));
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of video in seconds (if video)',
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Media width in pixels',
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Media height in pixels',
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'File size in bytes',
    },
    quality: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'original',
      comment: 'Media quality: original, 360p, 480p, 720p',
    },
    is_original: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag to identify original quality',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Display order if multiple media files',
    },
  });

  FeedMedia.associate = function (models) {
    FeedMedia.belongsTo(models.Feed, {
      foreignKey: "feed_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    });
  };

  return FeedMedia;
};
