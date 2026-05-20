module.exports = (sequelize, DataTypes) => {
    const Live = sequelize.define(
        "Live",
        {
            live_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            total_viewers: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            curent_viewers: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            likes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            socket_room_id: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 0,
            },
            comments: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            live_title: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
            },
            live_type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "", //live,battle
            },
            live_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "live", //live, stopped, requested_to_battle ,not_joined,resulting, resulted  
            },

            is_demo: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            battle_start_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            battle_end_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            time: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "1:00", //minutes:seconds Default battle time 1 minutes
            }

        }
    );
    Live.associate = function (models) {
        // Live.belongsTo(models.User, {
        //     foreignKey: "user_id",
        //     defaultValue: 0,
        //     onDelete: 'CASCADE'
        // })
        Live.hasMany(models.Live_host, {
            foreignKey: "live_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Live.hasMany(models.Coin_to_coin, {
            foreignKey: "live_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Live;
}