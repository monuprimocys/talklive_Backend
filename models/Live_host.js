module.exports = (sequelize, DataTypes) => {
    const Live_host = sequelize.define("Live_host", {
        live_host_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        is_live:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue:true,
        },
        is_main_host:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue:false,
        },
        is_winner: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        peer_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0,
        },
        total_gifts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "joined",// waiting_to_join, joined, left, not_joined
        },
        total_coins: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        }
    });
    Live_host.associate = function (models) {
        Live_host.belongsTo(models.User, {
            foreignKey: "user_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Live_host.belongsTo(models.Live, {
            foreignKey: "live_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Live_host;
}