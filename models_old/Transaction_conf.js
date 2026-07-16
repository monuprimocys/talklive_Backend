module.exports = (sequelize, DataTypes) => {
    const Transaction_conf = sequelize.define("Transaction_conf", {
        transaction_conf_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        payment_methods: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        tax: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        admin_margin: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        currency_symbol: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        coin_value_per_1_currency: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        transaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // Coin
        minimum_transaction: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        welcome_bonus: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        // uploader_id :{
        //     type: DataTypes.STRING,
        //     allowNull: false,
        // },

        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        

    });
    // Transaction_conf.associate = function (models) {
    //     Transaction_conf.belongsTo(models.User, {
    //         as:'uploader',
    //         foreignKey: "uploader_id",
    //         allowNull: false,
    //         onDelete: 'CASCADE'
    //     });
    // }
    return Transaction_conf;
}