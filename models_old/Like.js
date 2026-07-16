module.exports = (sequelize, DataTypes) => {
    const Like = sequelize.define("Like", {
        like_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        like_by: {
            type: DataTypes.INTEGER,
            allowNull: true,  // Allow null values for no user
        },
        social_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        comment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });

    // Define Associations
    Like.associate = function (models) {
        Like.belongsTo(models.User, { foreignKey: "like_by", onDelete: "CASCADE" });
        Like.belongsTo(models.Social, { foreignKey: "social_id", onDelete: "CASCADE" });
        Like.belongsTo(models.Comment, { foreignKey: "comment_id", onDelete: "CASCADE" });
    };

    return Like;
};
