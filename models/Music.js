const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
    const Music = sequelize.define("Music", {
        music_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        music_desc: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: "",
        },
        music_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        owner: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        admin_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        music_thumbnail: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                return formatMediaUrl(this.getDataValue("music_thumbnail"));
            },
        },
        music_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                return formatMediaUrl(this.getDataValue("music_url"));
            },
        },
        total_use: {
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

    });
    Music.associate = function (models) {
        // Music.belongsTo(models.User, {
        //     as: "Uploader",
        //     foreignKey: "uploader_id",

        // });
        Music.hasMany(models.Action, {
            foreignKey: "music_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Music.hasMany(models.Social, {
            foreignKey: "music_id",

        })
    }
    return Music;
}