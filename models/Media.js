const { formatMediaUrl } = require("../src/helper/url.helper");

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
                return formatMediaUrl(this.getDataValue("media_location"));
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