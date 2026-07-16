module.exports = (sequelize, DataTypes) => {
    const Block = sequelize.define("Block", {
        block_id: {
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

    Block.associate = function (models) {
        Block.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "blocker",
            onDelete: 'CASCADE'
        })
        // user will  be follow unfollow  by follower 
        // follower will follow unfollow user
        Block.belongsTo(models.User, {
            foreignKey: "blocked_id",
            as: "blocked",
            onDelete: 'CASCADE'

        })
    }
    return Block
}