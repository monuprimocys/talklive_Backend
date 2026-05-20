/**
 * Removes a specified item, key, or value from the given data.
 *
 * @param {Object|Array} data - The data to modify (array or object).
 * @param {any} target - The item, key, or value to remove.
 * @param {string} [mode="value"] - The mode of removal: "value" (default) or "key".
 * @returns {Object|Array} - The modified data.
 */
function    filterData(data, target, mode = "value") {
    if (Array.isArray(data)) {
        // For arrays, remove the value
        return data.filter(item => item !== target);
    } else if (typeof data === "object" && data !== null) {
        // For objects, remove a key
        if (mode === "key") {
            const newData = { ...data };
            delete newData[target];
            return newData;
        }
        // For objects, remove entries with a specific value
        if (mode === "value") {
            return Object.fromEntries(
                Object.entries(data).filter(([key, value]) => value !== target)
            );
        }
    }
    // If data is not an object or array, return it unchanged
    return data;
}

module.exports = filterData;
