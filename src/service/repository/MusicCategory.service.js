const { MusicCategory, Music, Sequelize } = require("../../../models");

async function createMusicCategory(payload) {
    return await MusicCategory.create(payload);
}

async function getMusicCategory(
    payload,
    includeOptions = [],
    attributesOptions = {},
    pagination = null
) {

    if (pagination) {
        const { page, pageSize } = pagination;

        const { rows, count } = await MusicCategory.findAndCountAll({
            where: payload,
            include: includeOptions,
            attributes: attributesOptions,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            distinct: true,
        });

        const records = rows.map(row => row.get());

        for (const item of records) {
            item.music_count = await Music.count({
                where: {
                    cat_id: item.cat_id,
                },
            });
        }

        return {
            Records: records,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: count,
                current_page: page,
                records_per_page: pageSize,
            },
        };
    }

    const categories = await MusicCategory.findAll({
        where: payload,
        raw: true,
    });

    for (const item of categories) {
        item.music_count = await Music.count({
            where: {
                cat_id: item.cat_id,
            },
        });
    }

    return categories;
}

async function updateMusicCategory(where, payload) {
    return await MusicCategory.update(payload, {
        where,
    });
}

async function deleteMusicCategory(payload) {
    return await MusicCategory.destroy({
        where: payload,
    });
}

module.exports = {
    createMusicCategory,
    getMusicCategory,
    updateMusicCategory,
    deleteMusicCategory,
};