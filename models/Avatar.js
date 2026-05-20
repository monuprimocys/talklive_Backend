module.exports = (sequelize, DataTypes) => {
    const Avatar = sequelize.define("Avatar", {
        avatar_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        avatar_media: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("avatar_media");
                let fullUrl =
                    // process.env.baseUrl + ":" + process.env.Port + "/" + rawUrl;
                    process.env.baseUrl + "/" + rawUrl;
                fullUrl == process.env.baseUrl ? "" : fullUrl;
                return fullUrl;
            },
        },
        avatar_gender:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

    });

    return Avatar;
}