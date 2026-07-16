const { formatMediaUrl } = require("../src/helper/url.helper");

module.exports = (sequelize, DataTypes) => {
    const Gift = sequelize.define("Gift", {
        gift_id: {
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
        gift_thumbnail: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                return formatMediaUrl(this.getDataValue("gift_thumbnail"));
            },
        },
        gift_value: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_use: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },


    });
    Gift.associate = function (models) {
        Gift.belongsTo(models.Admin, {
            as: "GiftUploader",
            foreignKey: "uploader_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        });
        Gift.belongsTo(models.Gift_category, {
            foreignKey: "gift_category_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        });
        Gift.hasMany(models.Notification, {
            foreignKey: "gift_id",
            allowNull: true,
            onDelete: 'CASCADE'
        });

    }
    return Gift;
}