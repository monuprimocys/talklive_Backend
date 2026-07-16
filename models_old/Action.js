module.exports = (sequelize, DataTypes) => {
    const Action = sequelize.define("Action", {
        action_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        social_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const social_id = this.getDataValue('social_id');
                return social_id === null ? 0 : social_id;
            },
        },
        music_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const music_id = this.getDataValue('music_id');
                return music_id === null ? 0 : music_id;
            },
        },
        like:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue: false
        },
        view:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue: false
        },
        bookmark:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue: false
        },
        action_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const action_by = this.getDataValue('action_by');
                return action_by === null ? 0 : action_by;
            },
        }
    })

    Action.associate = function (models) {
        Action.belongsTo(models.User, {
            foreignKey: "action_by",
            onDelete: 'CASCADE'
        })
        Action.belongsTo(models.Social, {
            foreignKey: "social_id",
            onDelete: 'CASCADE'
        })
        Action.belongsTo(models.Music, {
            foreignKey: "music_id",
            onDelete: 'CASCADE'
        })
    }
    return Action

}
