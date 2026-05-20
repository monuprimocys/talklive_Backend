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
                let rawUrl = this.getDataValue("gift_thumbnail");
                if (rawUrl?.includes("amazonaws.com") || rawUrl?.includes("cloudfront.net") ) {
                    return rawUrl
                }
                let fullUrl =
                    // process.env.baseUrl + ":" + process.env.Port + "/" + rawUrl;
                    process.env.baseUrl + "/" + rawUrl;
                fullUrl == process.env.baseUrl ? "" : fullUrl;
                return fullUrl;
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