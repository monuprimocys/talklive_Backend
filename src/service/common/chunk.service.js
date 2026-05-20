const fs = require('fs');
const path = require('path');

// Define the temp folder path
const TEMP_DIR = path.join(__dirname, 'uploads/temp');

// Ensure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Creates a temporary folder inside the temp directory.
 * The folder name is based on the provided filename and a timestamp.
 * 
 * @param {string} filename - Name of the file.
 * @returns {string} - Path of the created folder.
 */
function createTempFolder(filename) {
    // Replace invalid characters in filename for folder name
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const folderName = `${sanitizedFilename}_${timestamp}`;
    const folderPath = path.join(TEMP_DIR, folderName);

    // Create the folder
    fs.mkdirSync(folderPath, { recursive: true });
    return folderPath;
}

/**
 * Removes the specified temporary folder.
 * 
 * @param {string} folderPath - Full path to the folder to be removed.
 * @returns {boolean} - True if the folder is removed successfully, otherwise false.
 */
function removeTempFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        return true;
    }
    return false;
}

module.exports = { createTempFolder, removeTempFolder };
