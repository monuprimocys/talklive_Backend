module.exports = (sequelize, DataTypes) => {
    const Product_Media = sequelize.define("Product_Media", {
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        }, 
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const product_id = this.getDataValue('product_id');
                return product_id === null ? 0 : product_id;
            },
        },
        media_location: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("media_location");
                let fullUrl = process.env.baseUrl +"/" + rawUrl;

                fullUrl == process.env.baseUrl ? "" : fullUrl;

                return fullUrl;
            },
        }
    })

    Product_Media.associate = function (models) {
        Product_Media.belongsTo(models.Product, {
            foreignKey: "product_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Product_Media
}