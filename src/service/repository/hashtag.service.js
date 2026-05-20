
const { Op, Sequelize } = require("sequelize");
const { Hashtag, Social, sequelize } = require("../../../models");


const getHashTags = async (
  filterPayload = {},
  pagination = { page: 1, pageSize: 10 },
  attributes = [],
  order = [['createdAt', 'DESC']]
) => {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    if (filterPayload.hashtag_name) {
      const hashtagName = filterPayload.hashtag_name;
      filterPayload.hashtag_name = {
        [Op.like]: `${hashtagName}%`,
      };
    }

    const { rows, count } = await Hashtag.findAndCountAll({
      where: filterPayload,
      ...(attributes.length && { attributes }),
      limit,
      offset,
      order: order,
    });

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
    console.error('Error fetching Hashtags:', error);
    throw new Error('Could not retrieve Hashtags');
  }
};



async function createHashtag(hashtagPayload) {
  try {
    const newHashtag = await Hashtag.create(hashtagPayload);
    return newHashtag;
  } catch (error) {
    console.error('Error creating Hashtag:', error);
    throw error;
  }
}

async function updateHashtag(hashtagPayload, condition) {
  try {
    const newHashtag = await Hashtag.update(hashtagPayload, { where: condition });

    return newHashtag;
  } catch (error) {
    console.error('Error updating Hashtag:', error);
    throw error;
  }
}

// async function getHashtagsWithMinimumReels({
//   page = 1,
//   pageSize = 10,
//   minReels = 3
// }) {
//   const offset = (page - 1) * pageSize;

//   const countQuery = `
//     WITH extracted AS (
//       SELECT
//         LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) AS tag,
//         s."social_id"
//       FROM "Socials" s,
//       regexp_matches(s."social_desc", '#(\\w+)', 'g') AS match
//     ),
//     grouped AS (
//       SELECT tag, COUNT(*) AS total
//       FROM extracted
//       GROUP BY tag
//       HAVING COUNT(*) >= :minReels
//     )
//     SELECT COUNT(*) FROM grouped;
//   `;

//   const dataQuery = `
//     WITH extracted AS (
//   SELECT
//     LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) AS tag,
//     s.*
//   FROM "Socials" s,
//   regexp_matches(s."social_desc", '#(\\w+)', 'g') AS match
// ),
// grouped AS (
//   SELECT tag, COUNT(*) AS total
//   FROM extracted
//   GROUP BY tag
//   HAVING COUNT(*) >= :minReels
// ),
// ranked_socials AS (
//   SELECT
//     e.tag,
//     e."social_id",
//     e."social_desc",
//     e."reel_thumbnail",
//     e."createdAt",
//     ROW_NUMBER() OVER (PARTITION BY e.tag ORDER BY e."createdAt" DESC) AS rn
//   FROM extracted e
//   WHERE e.tag IN (SELECT tag FROM grouped)
// ),
// limited_socials AS (
//   SELECT * FROM ranked_socials WHERE rn <= 3
// ),
// latest_socials AS (
//   SELECT
//     tag,
//     json_agg(
//       json_build_object(
//         'social_id', "social_id",
//         'social_desc', "social_desc",
//         'reel_thumbnail', "reel_thumbnail",
//         'createdAt', "createdAt"
//       ) ORDER BY "createdAt" DESC
//     ) AS recent_socials
//   FROM limited_socials
//   GROUP BY tag
// )
// SELECT
//   g.tag AS hashtag_name,
//   g.total AS total_socials,
//   COALESCE(ls.recent_socials, '[]') AS "Social"
// FROM grouped g
// LEFT JOIN latest_socials ls ON g.tag = ls.tag
// ORDER BY g.total DESC
// OFFSET :offset LIMIT :limit;

//   `;

//   const replacements = {
//     minReels: Number(minReels),
//     offset,
//     limit: pageSize
//   };

//   const [countResult] = await sequelize.query(countQuery, {
//     replacements,
//     type: sequelize.QueryTypes.SELECT
//   });

//   const records = await sequelize.query(dataQuery, {
//     replacements,
//     type: sequelize.QueryTypes.SELECT
//   });

//   const total_records = parseInt(countResult.count || '0');

//   return {
//     Records: records,
//     Pagination: {
//       total_records,
//       current_page: Number(page),
//       total_records: Number(pageSize),
//       total_pages: Math.ceil(total_records / pageSize)
//     }
//   };
// }
async function getHashtagsWithMinimumReels({
  page = 1,
  pageSize = 10,
  minReels = 3
}) {
  const offset = (page - 1) * pageSize;
  const replacements = {
    minReels: Number(minReels),
    offset,
    limit: Number(pageSize)
  };

  // Updated count query with DISTINCT to prevent duplicates
  const countQuery = `
    WITH extracted AS (
      SELECT DISTINCT
        LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) AS tag,
        s."social_id"
      FROM "Socials" s,
      regexp_matches(s."social_desc", '#(\\w+)', 'g') AS match
    ),
    grouped AS (
      SELECT tag, COUNT(*) AS total
      FROM extracted
      GROUP BY tag
      HAVING COUNT(*) >= :minReels
    )
    SELECT COUNT(*) as count FROM grouped;
  `;

  // Updated data query with DISTINCT
  const dataQuery = `
    WITH extracted AS (
      SELECT DISTINCT
        LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) AS tag,
        s."social_id"
      FROM "Socials" s,
      regexp_matches(s."social_desc", '#(\\w+)', 'g') AS match
    ),
    grouped AS (
      SELECT tag, COUNT(*) AS total
      FROM extracted
      GROUP BY tag
      HAVING COUNT(*) >= :minReels
    )
    SELECT
      g.tag AS hashtag_name,
      g.total AS total_socials
    FROM grouped g
    ORDER BY g.total DESC
    OFFSET :offset LIMIT :limit;
  `;

  const [countResult] = await sequelize.query(countQuery, {
    replacements,
    type: sequelize.QueryTypes.SELECT
  });

  const tags = await sequelize.query(dataQuery, {
    replacements,
    type: sequelize.QueryTypes.SELECT
  });

  const total_records = parseInt(countResult.count || '0', 10);
  const tagNames = tags.map(tag => tag.hashtag_name);

  if (tagNames.length === 0) {
    return {
      Records: [],
      Pagination: {
        total_records,
        current_page: Number(page),
        page_size: Number(pageSize),
        total_pages: Math.ceil(total_records / pageSize)
      }
    };
  }

  // Fixed: Get distinct socials per tag without duplicates
  const recentSocialsData = await sequelize.query(`
    WITH extracted AS (
      SELECT DISTINCT
        LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) AS tag,
        s."social_id"
      FROM "Socials" s,
      regexp_matches(s."social_desc", '#(\\w+)', 'g') AS match
      WHERE LOWER(REGEXP_REPLACE(match[1], '[^a-zA-Z0-9_]', '', 'g')) IN (:tagNames)
    ),
    ranked_socials AS (
      SELECT DISTINCT ON (e.tag, e."social_id")
        e.tag,
        e."social_id",
        s."createdAt",
        ROW_NUMBER() OVER (PARTITION BY e.tag ORDER BY s."createdAt" DESC) AS rn
      FROM extracted e
      JOIN "Socials" s ON s."social_id" = e."social_id"
    )
    SELECT tag, "social_id" 
    FROM ranked_socials 
    WHERE rn <= 3
  `, {
    replacements: { tagNames },
    type: sequelize.QueryTypes.SELECT
  });

  // Extract unique social IDs
  const socialIds = [...new Set(recentSocialsData.map(item => item.social_id))];

  // Fetch full social instances
  const socialInstances = await Social.findAll({
    where: {
      social_id: socialIds
    }
  });

  // Create a map for quick lookup
  const socialsMap = new Map();
  socialInstances.forEach(social => {
    socialsMap.set(social.social_id, social.toJSON());
  });

  // Group by tag without duplicates
  const socialsByTag = {};
  recentSocialsData.forEach(item => {
    const social = socialsMap.get(item.social_id);
    if (social) {
      if (!socialsByTag[item.tag]) {
        socialsByTag[item.tag] = new Set();
      }
      // Using Set to prevent duplicates
      socialsByTag[item.tag].add(social);
    }
  });

  // Convert Sets to Arrays
  Object.keys(socialsByTag).forEach(tag => {
    socialsByTag[tag] = Array.from(socialsByTag[tag]);
  });

  // Combine with tag data
  const records = tags.map(tag => ({
    ...tag,
    Social: socialsByTag[tag.hashtag_name] || []
  }));

  return {
    Records: records,
    Pagination: {
      total_records,
      current_page: Number(page),
      page_size: Number(pageSize),
      total_pages: Math.ceil(total_records / pageSize)
    }
  };
}

module.exports = {
  getHashtagsWithMinimumReels
};


function extractHashtags(text) {
  // Match hashtags: words starting with # and containing letters, numbers, or underscores
  const regex = /#(\w+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]); // push without the '#'
  }
  return matches;
}


module.exports = {
  getHashTags,
  createHashtag,
  updateHashtag,
  extractHashtags,
  getHashtagsWithMinimumReels
};