module.exports = (sequelize, DataTypes) => {
    const Save = sequelize.define("Save", {
        like_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        
    });

    // Define Associations
    Save.associate = function (models) {
        Save.belongsTo(models.User, { foreignKey: "save_by", onDelete: "CASCADE" });
        Save.belongsTo(models.Social, { foreignKey: "social_id", onDelete: "CASCADE" });
    };

    return Save;
};
