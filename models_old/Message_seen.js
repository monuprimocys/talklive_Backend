module.exports = (sequelize, DataTypes) => {
    const Message_seen = sequelize.define("Message_seen", {
        message_seen_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        message_seen_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: false
        },
    });

    // user_id
    // message_id
    // chat_id

    Message_seen.associate = (models) => {
        Message_seen.belongsTo(models.Message, {
            foreignKey: "message_id",
            onDelete: 'CASCADE'
        });

        Message_seen.belongsTo(models.User, {
            foreignKey: "user_id",
            allowNull: true,
            defaultValue: 0,
            onDelete: 'CASCADE'
        });

        Message_seen.belongsTo(models.Chat, {
            foreignKey: "chat_id",
            onDelete: 'CASCADE'

        });
    };

    return Message_seen;
};
