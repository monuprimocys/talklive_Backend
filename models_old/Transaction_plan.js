module.exports = (sequelize, DataTypes) => {
    const Transaction_plan = sequelize.define("Transaction_plan", {
        plan_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        plan_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        coins: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        corresponding_money: {  // After Margin of Admin and Tax 
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue:0
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        currency_symbol: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        transaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },

    });
    Transaction_plan.associate = function (models) {
        Transaction_plan.hasMany(models.Money_coin_transaction, {
            foreignKey: "plan_id",
            allowNull: false,
            onDelete: 'CASCADE'
        });
    }
    return Transaction_plan;
}