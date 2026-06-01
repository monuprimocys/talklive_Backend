const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
    const Avatar = sequelize.define("Avatar", {
        avatar_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        avatar_media: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                return formatMediaUrl(this.getDataValue("avatar_media"));
            },
        },
        avatar_gender: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

    });

    return Avatar;
}