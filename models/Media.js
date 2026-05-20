module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define("Media", {
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        social_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const social_id = this.getDataValue('social_id');
                return social_id === null ? 0 : social_id;
            },
        },

       media_location: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: "",
  get() {
    const rawUrl = this.getDataValue("media_location");

    // ✅ empty check
    if (!rawUrl) return "";

    // ✅ already full URL (S3 / CloudFront / R2 / any CDN)
    if (
      rawUrl.includes("amazonaws.com") ||
      rawUrl.includes("cloudfront.net") ||
      rawUrl.includes("r2.cloudflarestorage.com") ||
      rawUrl.startsWith("http://") ||
      rawUrl.startsWith("https://")
    ) {
      return rawUrl;
    }

    // ✅ clean base URL (remove trailing /)
    const baseUrl = (process.env.baseUrl || "").replace(/\/$/, "");

    // ✅ clean path (remove starting /)
    const path = rawUrl.replace(/^\//, "");

    // ✅ final URL
    return `${baseUrl}/${path}`;
  },
},
        quality: {
            type: DataTypes.STRING, // 360p | 480p | 720p | original
            allowNull: false,
            defaultValue: "original",
        },

        is_original: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },


    })



    Media.associate = function (models) {
        Media.belongsTo(models.Social, {
            foreignKey: "social_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Media
}