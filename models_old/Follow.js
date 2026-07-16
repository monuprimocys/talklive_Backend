module.exports = (sequelize, DataTypes) => {
    const Follow = sequelize.define("Follow", {
        follow_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        approved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

    })

    Follow.associate = function (models) {
        Follow.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "User",
            onDelete: 'CASCADE'
        })
        // user will  be follow unfollow  by follower 
        // follower will follow unfollow user
        Follow.belongsTo(models.User, {
            foreignKey: "follower_id",
            as: "follower",
            onDelete: 'CASCADE'

        })
    }
    return Follow
}