const { Project_conf, User, Chat } = require("../../../models");

async function createConfig(configPayload) {
    try {
        const newConfig = await Project_conf.create(configPayload);
        return newConfig;
    } catch (error) {
        console.error('Error in creating config:', error);
        throw error;
    }
}

async function getConfig(condition) {
    try {
        const config = await Project_conf.findOne({ where: condition });
        return config;
    } catch (error) {
        console.error('Error in getting config:', error);
        throw error;
    }
}

async function updateConfig(configPayload, condition) {
    try {
        
        const updatedConfig = await Project_conf.update(configPayload, { where: condition, returning: true });
        
        return updatedConfig[1][0];
    } catch (error) {
        console.error('Error in updating config:', error);
        throw error;
    }
}

async function usersList() {
    try {
        const users = await User.findAll({ order: [['updatedAt', 'DESC']] });
        return users;
    } catch (error) {
        console.error('Error in fetching users:', error);
        throw error;
    }
}

async function getGroupChats() {
    try {
        const chats = await Chat.findAll({
            where: { chat_type: "Private" },
            order: [['updatedAt', 'DESC']],
            include: [
                {
                    association: 'participants',
                    attributes: ['participant_id'],
                    include: [
                        {
                            model: User,
                            as: "User",
                            attributes: ["user_id", "full_name", "user_name", "country", "profile_pic"],
                        },
                    ],
                },
            ]
        });
        return chats;
    } catch (error) {
        console.error('Error in fetching chats:', error);
        throw error;
    }
}


module.exports = {
    createConfig,
    getConfig,
    updateConfig,
    usersList,
    getGroupChats
}

