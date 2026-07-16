module.exports = (sequelize, DataTypes) => {
    const MusicSave = sequelize.define("MusicSave", {
        music_save_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
    });

    MusicSave.associate = function (models) {
        MusicSave.belongsTo(models.User, {
            foreignKey: "save_by",
            onDelete: "CASCADE",
        });

        MusicSave.belongsTo(models.Music, {
            foreignKey: "music_id",
            onDelete: "CASCADE",
        });
    };

    return MusicSave;
};