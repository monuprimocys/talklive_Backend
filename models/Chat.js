module.exports = (sequelize, DataTypes) => {
    const Chat = sequelize.define("Chat", {
        chat_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        chat_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        group_icon: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            get() {
                const raw_urls = this.getDataValue("group_icon");
                const imageUrls = `${process.env.baseUrl}${raw_urls}`;
                return imageUrls != process.env.baseUrl
                    ? imageUrls
                    : `${process.env.baseUrl}uploads/not-found-images/group-image.png`;
            },
        },
        group_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
    })

    // Participan_id

    Chat.associate = function (models) {
        Chat.hasMany(models.Participant, {
            foreignKey: "chat_id",
            onDelete: 'CASCADE'
        })
        Chat.hasMany(models.Message, {
            foreignKey: "chat_id",
            allowNull: true,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Chat.hasMany(models.Message_seen, {
            foreignKey: "chat_id",
            onDelete: 'CASCADE'
        })

    }
    return Chat

}
