module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define("Product", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        product_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        product_desc: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },

        product_thumbnail: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("product_thumbnail");
                let fullUrl = process.env.baseUrl + "/" + rawUrl;
                fullUrl == process.env.baseUrl ? "" : fullUrl;
                return fullUrl;
            },
        },
        product_video: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("product_video");
                let fullUrl = process.env.baseUrl + "/" + rawUrl;
                fullUrl == process.env.baseUrl ? "" : fullUrl;
                return fullUrl;
            },
            
        },
        aspect_ratio: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        video_hight: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        product_original_price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0, 
        },
        product_sale_price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0, 
        },
        product_price_currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "د.ك", 
        },
        product_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0, 
        },

        country: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",

        },
    })
    Product.associate = function (models) {
        Product.belongsTo(models.User, {
            foreignKey: "user_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Product.hasMany(models.Product_Media, {
            foreignKey: "product_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        
    }
    return Product;
}