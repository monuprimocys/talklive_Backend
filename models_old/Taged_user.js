module.exports = (sequelize, DataTypes) => {
    const Taged_user = sequelize.define("Taged_user", {
        taged_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        social_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const post_id = this.getDataValue('post_id');
                return post_id === null ? 0 : post_id;
            },
        },
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const taged_by = this.getDataValue('owner_id');
                return taged_by === null ? 0 : taged_by;
            },
        },
        taged_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const taged = this.getDataValue('taged_user_id');
                return taged === null ? 0 : taged;
            },
        },


    })

    Taged_user.associate = function (models) {
        Taged_user.belongsTo(models.User, {
            foreignKey: 'owner_id',
            as: "Owner",
            onDelete: 'CASCADE'
        })
        Taged_user.belongsTo(models.User, {
            foreignKey: 'taged_user_id',
            as: "Taged_in",
            onDelete: 'CASCADE'
        })
        Taged_user.belongsTo(models.Social, {
            foreignKey: "social_id",
            onDelete: 'CASCADE'
        })
    }

    return Taged_user
}
