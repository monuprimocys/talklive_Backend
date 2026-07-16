const updateFieldsFilter = (data, allowedFields, strictmode = false) => {
    const filteredData = {};
    
    // Check if all allowedFields are present in data
    allowedFields.forEach((field) => {
        if (!(field in data) && strictmode) {
            throw new Error(`Missing field: ${field}. Allowed fields are: ${allowedFields.join(', ')}`);
        }
    });

    // Filter data based on allowedFields
    Object.keys(data).forEach((key) => {
        if (allowedFields.includes(key)) {
            filteredData[key] = data[key];
        }
    });

    return filteredData;
};

module.exports = updateFieldsFilter;
