module.exports = (sequelize, DataTypes) => {
    const Gift_category = sequelize.define("Gift_category", {
        gift_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name : {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        status : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        admin_status : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

    });
    Gift_category.associate = function (models) {
        Gift_category.belongsTo(models.Admin, {
            as: "GiftCategoryUploader",
            foreignKey: "uploader_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        });
        Gift_category.hasMany(models.Gift, {
            foreignKey: "gift_category_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        });
        
    }
    return Gift_category;
}