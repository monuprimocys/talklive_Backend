const { sequelize } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getWordTranslation } = require("../../service/common/translate.service");
const { createLanguage, getLanguages, updateLanguage, createLanguageTranslation, getLanguageTranslation, getKeywords } = require("../../service/repository/Language.service");


// Create Avatar
async function add_new_language(req, res) {
    try {
        const allowedFields = ['language', 'language_alignment'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields, true);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }
        const newLanguage = await createLanguage(filteredData);
        const newlanguagetranslation = await createLanguageTranslation({ language: newLanguage.language });
        return generalResponse(res, newLanguage, "Language Created Successfully", true, false);
    } catch (error) {
        console.error("Error in adding new language", error);
        return generalResponse(res, { success: false }, "Something went wrong while creating new language!", false, true);
    }
}


// Get Avatars (with pagination/filter)

async function listLanguage(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body;
        const allowedFields = ['language', 'language_alignment', 'status'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }

        const avatars = await getLanguages(filteredData, { page, pageSize });
        return generalResponse(res, avatars, "Languages Found", true, false);
    } catch (error) {
        console.error("Error in finding Languages", error);
        return generalResponse(res, { success: false }, "Something went wrong while finding Languages!", false, true);
    }
}


async function listLanguageKeywords(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body;
        const allowedFields = ['key'];
        if (!req.body.language_id) {
            return generalResponse(res, { success: false }, "language_id is required", false, true);
        }
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }
        const language = await getLanguages({ language_id: req.body.language_id });
        filteredData.language = language.Records[0].language
        const words = await getKeywords(filteredData, { page, pageSize });

        return generalResponse(res, words, "Languages Found", true, false);
    } catch (error) {
        console.error("Error in finding Languages", error);
        return generalResponse(res, { success: false }, "Something went wrong while finding Languages!", false, true);
    }
}


// Update Avatar
async function update_Language(req, res) {
    try {
        const allowedFields = ['language_alignment', 'status', 'default_status'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }
        if (!req.body.language_id) {
            return generalResponse(res, { success: false }, "language_id is required", false, true);
        }

        if (filteredData.default_status == "true") {

            await updateLanguage({ default_status: true }, { default_status: false });
        }

        const updated = await updateLanguage({ language_id: req.body.language_id }, filteredData);
        const language = await getLanguages({ language_id: req.body.language_id });
        if (language.Records.length == 0) {
            return generalResponse(res, { success: false }, "Language not found", false, true);
        }
        return generalResponse(res, language, "Language Updated", true, false);
    } catch (error) {
        console.error("Error in updating Language", error);
        return generalResponse(res, { success: false }, "Something went wrong while updating Language!", false, true);
    }
}


async function translate_all_keywords(req, res) {
    try {
        const allowedFields = ['language_id'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields, true);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }

        const language = await getLanguages({ language_id: filteredData.language_id });
        if (language.Records.length == 0) {
            return generalResponse(res, { success: false }, "Language not found", false, true);
        }
        const translation_res = await getLanguageTranslation(language.Records[0].language);

        for (const setting_id in translation_res) {
            const translatedValue = translation_res[setting_id];

            await sequelize.query(
                `UPDATE "Language_translations" SET "${language.Records[0].language}" = :translatedValue WHERE "key_id" = :setting_id`,
                {
                    replacements: { translatedValue, setting_id },
                    type: sequelize.QueryTypes.UPDATE,
                }
            );

        }
        return generalResponse(res, translation_res, "Language Translated", true, false);
    } catch (error) {
        console.error("Error in updating Language", error);
        return generalResponse(res, { success: false }, "Something went wrong while updating Language!", false, true);
    }
}

async function translate_single_keywords(req, res) {
    try {
        const allowedFields = ['language_id', 'key_id', 'key'];
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedFields, true);
        } catch (err) {
            return generalResponse(res, { success: false }, err.message, false, true);
        }

        const language = await getLanguages({ language_id: filteredData.language_id });
        if (language.Records.length == 0) {
            return generalResponse(res, { success: false }, "Language not found", false, true);
        }
        const translation_res = await getWordTranslation(language.Records[0].language, filteredData.key, filteredData.key_id);
        const translatedValue = translation_res[filteredData.key_id];

        const updateResult = await sequelize.query(
            `UPDATE "Language_translations" SET "${language.Records[0].language}" = :translatedValue WHERE "key_id" = :key_id`,
            {
                replacements: { translatedValue, key_id: filteredData.key_id },
                type: sequelize.QueryTypes.UPDATE,
            }
        );
        // for (const setting_id in translation_res) {
        //     const translatedValue = translation_res[setting_id];

        //     await sequelize.query(
        //         `UPDATE "Language_translations" SET "${language.Records[0].language}" = :translatedValue WHERE "key_id" = :setting_id`,
        //         {
        //             replacements: { translatedValue, setting_id },
        //             type: sequelize.QueryTypes.UPDATE,
        //         }
        //     );

        //   }
        return generalResponse(res, translation_res, "Language Translated", true, false);
    } catch (error) {
        console.error("Error in updating Language", error);
        return generalResponse(res, { success: false }, "Something went wrong while updating Language!", false, true);
    }
}


module.exports = {
    add_new_language,
    listLanguage,
    update_Language,
    translate_all_keywords,
    translate_single_keywords,
    listLanguageKeywords
};