const fs = require('fs');
const path = require('path');

/**
 * Update or add an environment variable in a .env file.
 * @param {string} key - The name of the environment variable.
 * @param {string} value - The value of the environment variable.
 * @param {string} [envPath='.env'] - Optional path to the .env file.
 */

function updateEnvVariable(key, value, envPath = path.resolve(process.cwd(), '.env')) {
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, '', 'utf8');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    // Ensure key is in uppercase
    const upperKey = key.toUpperCase();

    const keyExists = lines.some(line => line.trim().startsWith(`${upperKey}=`));

    const newLines = keyExists
        ? lines.map(line =>
            line.trim().startsWith(`${upperKey}=`) ? `${upperKey}=${value}` : line
        )
        : [...lines, `${upperKey}="${value}"`];

    const finalContent = newLines
        .filter(line => line.trim() !== '')
        .join('\n') + '\n';

    fs.writeFileSync(envPath, finalContent, 'utf8');
}

module.exports = updateEnvVariable;
