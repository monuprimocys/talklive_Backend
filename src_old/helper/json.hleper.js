/**
 * Recursively converts Sequelize model instances (or arrays of instances) to plain JSON objects, 
 * including handling associations and replacing null foreign key fields with empty arrays.
 * This function is particularly useful for serializing data with associations like `belongsTo`, `hasOne`, etc.
 * 
 * @param {Object|Array} modelInstanceOrArray - A single Sequelize model instance or an array of model instances 
 *                                             that need to be converted to JSON.
 * @param {Array} foreignKeysConfig - An optional array of objects containing foreign key mappings. 
 *                                    Each object should have the following properties:
 *                                    - `foreign_key` (string): The name of the foreign key field in the model.
 *                                    - `Model` (function): The Sequelize model that the foreign key refers to.
 *                                    - `alias_name` (string): The alias used in the `include` query for the foreign model.
 * 
 * @returns {Object|Array} - A plain JavaScript object (or an array of objects) representing the model instance(s), 
 *                            with associations recursively processed and foreign key associations with null values 
 *                            replaced by empty arrays.
 * 
 * @example
 * const foreignKeysConfig = [
 *     { foreign_key: 'social_id', Model: Social, alias_name: 'social' },
 *     { foreign_key: 'user_id', Model: User, alias_name: 'user' }
 * ];
 * 
 * const rowsData = await toJSONWithAssociations(rows, foreignKeysConfig);
 */
let  count = 0
async function toJSONWithAssociations(modelInstanceOrArray, foreignKeysConfig = []) {
    // Check if the input is an array of Sequelize instances
    if (Array.isArray(modelInstanceOrArray)) {
        // Process each element in the array
        return Promise.all(modelInstanceOrArray.map(async (item) => {
            return await toJSONWithAssociations(item, foreignKeysConfig);
        }));
    }

    // If it's a single model instance
    if (modelInstanceOrArray && typeof modelInstanceOrArray.toJSON === 'function') {
        let jsonData = modelInstanceOrArray.toJSON();
        
        // Loop through foreign keys configuration to handle each foreign key field
        for (const config of foreignKeysConfig) {
            const { foreign_key, Model, alias_name } = config;
            
            // Check if the foreign key field exists in the data and if it's null
            if (jsonData[foreign_key] == 0 || jsonData[foreign_key] === null) {
                jsonData[alias_name] = {};
            }
            // Check if there's associated data (model) and it's not null, then process it
            if (jsonData[alias_name] && jsonData[alias_name].toJSON) {
                // Recursively process the association
                jsonData[alias_name] = await toJSONWithAssociations(jsonData[alias_name], foreignKeysConfig);
            }
        }

        // Recursively process associations if present
        for (const key in jsonData) {
            if (jsonData[key] && jsonData[key].toJSON) {
                // Recursively convert associated data
                jsonData[key] = await toJSONWithAssociations(jsonData[key], foreignKeysConfig);
            }
        }

        return jsonData;
    }

    // Return the instance if it's not a Sequelize model (or is already a plain object)
    return modelInstanceOrArray;
}

module.exports = { toJSONWithAssociations };
