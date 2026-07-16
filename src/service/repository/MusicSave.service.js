const { MusicSave } = require("../../../models");

async function createMusicSave(payload) {
    return await MusicSave.create(payload);
}

async function getMusicSave(
    payload,
    includeOptions = [],
    attributesOptions = {},
    pagination = { page: 1, pageSize: 10 }
) {
    const { page, pageSize } = pagination;

    const { rows, count } = await MusicSave.findAndCountAll({
        where: payload,
        include: includeOptions,
        attributes: attributesOptions,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        distinct: true,
    });

    return {
        Records: rows.map(row => row.get()),
        Pagination: {
            total_pages: Math.ceil(count / pageSize),
            total_records: count,
            current_page: page,
            records_per_page: pageSize,
        },
    };
}

async function deleteMusicSave(payload) {
    return await MusicSave.destroy({
        where: payload,
    });
}

module.exports = {
    createMusicSave,
    getMusicSave,
    deleteMusicSave,
};