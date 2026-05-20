const { createConfig } = require("./Project_conf.service");

async function demo_entries() {
    try {
        await createConfig();

    } catch (error) {

    }
}