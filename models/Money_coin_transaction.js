module.exports = (sequelize, DataTypes) => {
    const Money_coin_transaction = sequelize.define("Money_coin_transaction", {
        transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        payment_method: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        acutal_money: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        available_money: {  // After Margin of Admin and Tax 
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        success: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        transaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        coin_price: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        past_coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        new_available_coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        tax: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0

        },
        admin_margin: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        transaction_id_gateway: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },
        transaction_email: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },


    });
    Money_coin_transaction.associate = function (models) {
        Money_coin_transaction.belongsTo(models.User, {
            foreignKey: "user_id",
            allowNull: false,
            onDelete: 'CASCADE'
        });

        Money_coin_transaction.belongsTo(models.Transaction_plan, {
            foreignKey: "plan_id",
            allowNull: false,
            onDelete: 'CASCADE'
        });
    }
    return Money_coin_transaction;
}