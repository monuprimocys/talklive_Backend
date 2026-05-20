const { Op } = require('sequelize');
const { Language, sequelize, Sequelize } = require("../../../models");
const { translateText } = require('../common/translate.service');

async function createLanguage(languagePayload) {
    try {
        const newLanguage = await Language.create(languagePayload);
        return newLanguage;
    } catch (error) {
        console.error('Error creating Language:', error);
        throw error;
    }
}

async function getLanguages(filter = {}, pagination = { page: 1, pageSize: 10 }, order = [['createdAt', 'DESC']]) {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const query = {
            where: filter,
            limit,
            offset,
            order,
        };

        const { rows, count } = await Language.findAndCountAll(query);

        return {
            Records: rows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error fetching Language:', error);
        throw error;
    }
}

async function updateLanguage(filter, updateData) {
    try {

        const [updatedCount] = await Language.update(updateData, { where: filter });
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Language:', error);
        throw error;
    }
}

async function createLanguageTranslation(language_payload) {
    const queryInterface = sequelize.getQueryInterface();

    try {
        const tableDescription = await queryInterface.describeTable(
            "Language_translations"
        );
        if (!tableDescription[language_payload.language]) {
            // If column does not exist
            // Add the new column
            await queryInterface.addColumn("Language_translations", language_payload.language, {
                type: Sequelize.STRING,
                allowNull: true, 
            });
          
            // Update the newly added column with values from the 'key' column
            await queryInterface.sequelize.query(`
                UPDATE "Language_translations"
                SET "${language_payload.language}" = "key"
              `);
              

              
        } else {
        }
    } catch (error) {
        console.error('Error creating Language Translation:', error);
        throw error;
    }
}

async function getKeywords(filterPayload, pagination = { page: 1, pageSize: 10 }) {
    try {
        const offset = (pagination.page - 1) * pagination.pageSize;

        const results = await sequelize.query(
            `SELECT "key_id", "key", "${filterPayload.language}" FROM "Language_translations" LIMIT :limit OFFSET :offset`,
            {
                replacements: { limit: pagination.pageSize, offset },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const totalResult = await sequelize.query(
            `SELECT COUNT(*) as total FROM "Language_translations"`,
            {
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const total = parseInt(totalResult[0]?.total || 0, 10);
        const totalPages = Math.ceil(total / pagination.pageSize);

        const formattedResults = results.map((row) => ({
            key_id: row.key_id,
            key: row.key,
            Translation: row[filterPayload.language],
        }));

        return {
            Records: formattedResults,
            Pagination: {
                current_page: pagination.page,
                records_per_page: pagination.pageSize,
                total_records:total,
                total_pages:totalPages,
            },
        };
    } catch (error) {
        console.error('Error fetching Language Keywords:', error);
        throw error;
    }
}

async function getLanguageTranslation( terget_language ){
    try {
        const results = await sequelize.query(
            `SELECT key_id, "key" FROM "Language_translations"`,
            {
                type: sequelize.QueryTypes.SELECT,
            }
        );
        
        const jsonData = results.reduce((acc, row) => {
            acc[row.key_id] = row.key; // setting_id as key, 'key' value to be translated
            return acc;
        }, {});
        const requestData = {
            json_data: jsonData,
            target_language: terget_language,
          };
        const res = await translateText(requestData)
        return res
    } catch (error) {
        console.error('Error fetching Language Translation:', error);
        throw error;

    }
}


module.exports = {
    createLanguage,
    getLanguages,
    updateLanguage,
    createLanguageTranslation,
    getLanguageTranslation,
    getKeywords
};