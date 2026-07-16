const { exec } = require('child_process');

/**
 * Automatically restarts a PM2 process by its name.
 * @param {string} processName - The name of the PM2 process to restart.
 * @returns {Promise<string>} - Resolves with PM2 output or rejects with error.
 */
function restartPm2Process(processName) {
    return new Promise((resolve, reject) => {
        if (!processName || typeof processName !== 'string') {
            return reject(new Error('Invalid PM2 process name'));
        }

        const command = `pm2 restart ${processName}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Failed to restart PM2 process: ${stderr || error.message}`);
            }
            resolve(`PM2 process '${processName}' restarted:\n${stdout}`);
        });
    });
}


module.exports = {
    restartPm2Process
}