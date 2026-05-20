const fs = require('fs');
const path = require('path');

/**
 * Deletes a file in the uploads folder based on the given relative path.
 * @param {string} relativeFilePath - Relative path to the file (e.g., 'uploads/profile_pic/image.png').
 */
function deleteFile(relativeFilePath) {
    // Resolve the path relative to the project root
    const absolutePath = path.join(__dirname, '../../../', relativeFilePath);

    fs.access(absolutePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File does not exist: ${absolutePath}`);
            return;
        }

        fs.unlink(absolutePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${absolutePath}`, err);
                return;
            }

        });
    });
}

module.exports = deleteFile;
