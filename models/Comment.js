
module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define("Comment", {
        comment_id: {
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

        comment_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const value = this.getDataValue('comment_by');
                return value === null ? 0 : value;
            },
        },

        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""

        },
        comment_ref_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            toDefaultValue: 0,
            get() {
                const comment_ref_id = this.getDataValue('comment_ref_id');
                return comment_ref_id === null ? 0 : comment_ref_id;
            },
        }
    })
    
    Comment.associate = function (models) {
        Comment.belongsTo(models.User, {
            foreignKey: "comment_by",
            as: "commenter",
            onDelete: 'CASCADE'
        })
        Comment.belongsTo(models.Social, {
            foreignKey: "social_id",
            allowNull: true,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Comment.hasMany(models.Like, {
            foreignKey: "comment_id",
            allowNull: true,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }

    return Comment
}
