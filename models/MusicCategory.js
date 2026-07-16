module.exports = (sequelize, DataTypes) => {
    const MusicCategory = sequelize.define("MusicCategory", {
        cat_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        category_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    });

    MusicCategory.associate = function(models) {
        // MusicCategory.hasMany(models.Music, {
        //     foreignKey: "cat_id",
        //     as: "musics",
        // });
    };

    return MusicCategory;
};