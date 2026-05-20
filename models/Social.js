module.exports = (sequelize, DataTypes) => {
  const Social = sequelize.define("Social", {
    social_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    social_desc: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    social_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    aspect_ratio: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    video_hight: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },

 reel_thumbnail: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: "",
  get() {
    let rawUrl = this.getDataValue("reel_thumbnail");

    // ✅ empty check
    if (!rawUrl) return "";

    // ✅ already full URL (S3 / R2 / CDN)
    if (
      rawUrl.includes("amazonaws.com") ||
      rawUrl.includes("cloudfront.net") ||
      rawUrl.includes("r2.cloudflarestorage.com") ||
      rawUrl.startsWith("http://") ||
      rawUrl.startsWith("https://")
    ) {
      return rawUrl;
    }

    // ✅ base URL join safely
    const baseUrl = process.env.baseUrl?.replace(/\/$/, ""); // remove trailing /
    const path = rawUrl.replace(/^\//, ""); // remove starting /

    const fullUrl = `${baseUrl}/${path}`;

    return fullUrl;
  },
},
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    total_views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_saves: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_shares: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    deleted_by_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hashtag: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  });
  Social.associate = function (models) {
    Social.belongsTo(models.User, {
      foreignKey: "user_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Taged_user, {
      foreignKey: "social_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Media, {
      foreignKey: "social_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Action, {
      foreignKey: "social_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.ReportedSocials, {
      foreignKey: "social_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Like, {
      foreignKey: "social_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Save, {
      foreignKey: "social_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Comment, {
      foreignKey: "social_id",
      allowNull: false,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.hasMany(models.Message, {
      foreignKey: "social_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: 'CASCADE'
    })
    Social.belongsTo(models.Music, {
      foreignKey: "music_id",

    })
    Social.hasMany(models.Notification, {
      foreignKey: "social_id",
      allowNull: true,
      onDelete: 'CASCADE'
    })
  }
  return Social;
}