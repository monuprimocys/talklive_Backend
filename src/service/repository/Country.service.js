
const { Country } = require("../../../models");


async function createCountry(countryPayload) {
    try {
        const [newCountry, created] = await Country.findOrCreate({
            where: { country_name: countryPayload.country },
            defaults: countryPayload,
        });

        if (!created) {
            // Increment the country_user field if the country already exists
            await newCountry.increment('country_user', { by: 1 });
        }

        return { newCountry, created }; // Returns the instance and creation status
    } catch (error) {
        console.error('Error creating or updating country:', error);
        throw error;
    }
}


async function getcountry(countryPayload, pagination = { page: 1, pageSize: 10 }) {
    try {
        const { page, pageSize } = pagination;

        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Add pagination options to the payload
        const query = {
            where: {
                ...countryPayload
            },
            limit,
            offset,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Country.findAndCountAll(query);

        // Prepare the structured response
        return {
            Records: rows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: count,
                current_page: page,
                records_per_page: pageSize,
            },
        };
    } catch (error) {
        console.error('Error fetching countries:', error);
        throw error;
    }
}

async function deleteCountry(countryName) {
    try {
        // Find the country by its name
        const country = await Country.findOne({
            where: { country_name: countryName },
        });

        if (!country) {
            throw new Error(`Country with name "${countryName}" not found.`);
        }

        if (country.country_user > 1) {
            // Decrease `country_user` by 1 if it's greater than 1
            await country.decrement('country_user', { by: 1 });
        } else {
            // Delete the country if `country_user` is 1
            await country.destroy();
        }

        return { success: true, message: 'Operation completed successfully.' };
    } catch (error) {
        console.error('Error deleting or decrementing country:', error);
        throw error;
    }
}

module.exports = {
    createCountry,
    getcountry,
    deleteCountry
}