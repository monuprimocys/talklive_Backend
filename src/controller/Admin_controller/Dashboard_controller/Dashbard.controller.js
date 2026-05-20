const { generalResponse } = require("../../../helper/response.helper");
const { getUserCount, getUserCountData } = require("../../../service/repository/user.service");
const { Op } = require('sequelize');
const moment = require('moment');
const { getSocialCount } = require("../../../service/repository/SocialMedia.service");
const { fn, col } = require('sequelize'); // Make sure these are imported
const { sequelize } = require("../../../../models");
const { getLiveCount } = require("../../../service/repository/Live.service");
const { getMoneyCoinTransaction, getMoneyCoinTransactionWithoutPagination } = require("../../../service/repository/Transactions/Money_coin_transaction.service");
const { getCoinToCoinTransaction } = require("../../../service/repository/Transactions/Coin_coin_transaction.service");

async function TotalUserCard(req, res) {
    try {
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        const userPayload = {
            createdAt: {
                [Op.lte]: endOfLastMonth, // Less than or equal to end of last month
            },
        };

        const total_counts = await getUserCount();
        const lastMonthCount = await getUserCount(userPayload);
        return generalResponse(
            res,
            {
                total_counts: total_counts,
                lastMonth_Count: lastMonthCount
            },
            "Total User Count",
            true,
            false
        )
    } catch (error) {
        console.error('Error in TotalUserCard:', error);
        return generalResponse(
            res,
            {},
            "Error in TotalUserCard",
            false,
            true,
            500
        )
    }
}

async function countryWiseUser(req, res) {
    try {
        const page = Number(req.body.page) || 1;
        const limit = Number(req.body.pageSize) || 10;
        const offset = (page - 1) * limit;

        const topCountries = await getUserCountData({}, {
            attributes: [
                'country',
                'country_short_name',
                [fn('COUNT', col('user_id')), 'user_count']
            ],
            group: ['country', 'country_short_name'],
            order: [[fn('COUNT', col('user_id')), 'DESC']],
            limit,
            offset,
        });


        const totalCounts = await getUserCount(); // full user count


        return generalResponse(
            res,
            {
                pagination: {
                    current_page: page,
                    records_per_page: limit,
                    total_records: topCountries.length,
                    total_pages: Math.ceil(topCountries.length / limit)
                },
                total_users: totalCounts,
                Records: topCountries
            },
            "Country Wise User Count",
            true,
            false
        );

    } catch (error) {
        console.error('Error in countryWiseUser:', error);
        return generalResponse(
            res,
            {},
            "Error in Country Wise User Count",
            false,
            true,
            500
        );
    }
}

async function getMonthlyUserCountsByYear(req, res) {
    try {
        const year = Number(req.body.year) || new Date().getFullYear();
        const monthlyCounts = [];

        for (let month = 0; month < 12; month++) {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0, 23, 59, 59); // Last day of the month

            const userPayload = {
                createdAt: {
                    [Op.between]: [start, end],
                },
            };

            const count = await getUserCount(userPayload);
            monthlyCounts.push({
                month: month + 1, 
                count,
            });
        }
        return generalResponse(
            res,
            {
                year: year,
                monthlyCounts: monthlyCounts
            },
            "User monthlyCounts",
            true,
            false
        )
    } catch (error) {
        console.error('Error in getMonthlyUserCountsByYear:', error);
        return generalResponse(
            res,
            {},
            "Error in TotalUserCard",
            false,
            true,
            500
        )
    }
}

async function platformCard(req, res) {
    const { platform } = req.body;

    try {
        if (platform) {
            // Return count of users where platform exists in the array
            const [results] = await sequelize.query(`
                SELECT COUNT(*) AS count 
                FROM "Users" 
                WHERE :platform = ANY(platforms)
            `, {
                replacements: { platform },
                type: sequelize.QueryTypes.SELECT,
            });


            return generalResponse(
                res,
                {
                    platform,
                    count: parseInt(results.count, 10)
                },
                "Platform Count",
                true,
                false
            );

        } else {
            // Return count of all platforms by unnesting array
            const [results] = await sequelize.query(`
                SELECT value AS platform, COUNT(*) 
                FROM (
                    SELECT UNNEST(platforms) AS value
                    FROM "Users"
                ) AS unnested
                GROUP BY value
            `);

            const response = results.map(row => ({
                platform: row.platform,
                count: parseInt(row.count, 10)
            }));

            return generalResponse(
                res,
                response,
                "Platform Count",
                true,
                false
            );
        }
    } catch (error) {
        console.error('Error in platformCard:', error);
        return generalResponse(
            res,
            {},
            "Error in platformCard",
            false,
            true,
            500
        );
    }
}
async function loginTypeCard(req, res) {

    try {

        // Return count of all platforms by unnesting array
        const email_count = await getUserCount({ login_type: "email" });
        const phone_count = await getUserCount({ login_type: "phone" });
        const social_count = await getUserCount({ login_type: "social" });

        return generalResponse(
            res,
            {
                email_count: email_count,
                phone_count: phone_count,
                social_count: social_count
            },
            "Login Type Count",
            true,
            false
        );

    } catch (error) {
        console.error('Error in login type:', error);
        return generalResponse(
            res,
            {},
            "Error in login type",
            false,
            true,
            500
        );
    }
}

async function SocialtypeCard(req, res) {
    try {


        const total_reels = await getSocialCount({ social_type: "reel" });
        const total_posts = await getSocialCount({ social_type: "post" });
        return generalResponse(
            res,
            {
                total_reels: total_reels,
                total_posts: total_posts
            },
            "Total Social Count with types",
            true,
            false
        )
    } catch (error) {
        console.error('Error in TotalSocailCount with types:', error);
        return generalResponse(
            res,
            {},
            "Error in TotalSocailCount with types",
            false,
            true,
            500
        )
    }
}
async function TotalSocialCard(req, res) {
    try {
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        const socialPayload = {
            createdAt: {
                [Op.lte]: endOfLastMonth, // Less than or equal to end of last month
            },
        };
        const total_socialPayload = {}
        if (req.body.social_type) {

            socialPayload.social_type = req.body.social_type
            total_socialPayload.social_type = req.body.social_type
        }
        const total_counts = await getSocialCount(total_socialPayload);
        const lastMonthCount = await getSocialCount(socialPayload);
        return generalResponse(
            res,
            {
                total_counts: total_counts,
                lastMonth_Count: lastMonthCount
            },
            "Total Social Count",
            true,
            false
        )
    } catch (error) {
        console.error('Error in TotalSocailCard:', error);
        return generalResponse(
            res,
            {},
            "Error in TotalSocialCard",
            false,
            true,
            500
        )
    }
}
async function TotalLiveCard(req, res) {
    try {
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        const livePayload = {
            createdAt: {
                [Op.lte]: endOfLastMonth, // Less than or equal to end of last month
            },
        };
        const total_livePayload = {}
        if (req.body.live_status) {

            livePayload.live_status = req.body.live_status
            total_livePayload.live_status = req.body.live_status
        }
        const total_counts = await getLiveCount(total_livePayload);
        const lastMonthCount = await getLiveCount(livePayload);
        return generalResponse(
            res,
            {
                total_counts: total_counts,
                lastMonth_Count: lastMonthCount
            },
            "Total Live Count",
            true,
            false
        )
    } catch (error) {
        console.error('Error in TotalSocailCard:', error);
        return generalResponse(
            res,
            {},
            "Error in TotalSocialCard",
            false,
            true,
            500
        )
    }
}

async function TotalIncomeCard(req, res) {
    try {



        // if (transaction_table == "coin") {

        //         transactions = await getCoinToCoinTransaction({success:success}, { page, pageSize }, [], includeOptions)   
        // }

        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        const userPayload = {
            createdAt: {
                [Op.lte]: endOfLastMonth, // Less than or equal to end of last month
            },
            transaction_type: "recharge", success: "success"
        };
        const transactions = await getMoneyCoinTransactionWithoutPagination({ transaction_type: "recharge", success: "success" })
        let total_income = 0
        let total_count = 0

        if (transactions.Records.length > 0) {
            transactions.Records.forEach((transaction) => {
                total_income += transaction.acutal_money;
            });
            total_count = transactions.Count


        }


        const transactiontillLast = await getMoneyCoinTransactionWithoutPagination(userPayload)
        let till_last_income = 0
        let till_last_count = 0

        if (transactiontillLast.Records.length > 0) {
            transactiontillLast.Records.forEach((transaction) => {
                till_last_income += transaction.acutal_money;
            });
            till_last_count = transactions.Count

        }

        return generalResponse(
            res,
            {
                total_income: total_income,
                lastMonth_income: till_last_income,
                total_count: total_count,
                lastMonth_Count: till_last_count
            },
            "Total Income Count",
            true,
            false
        )

    } catch (error) {
        console.error("Error in Getting Transaction history", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong Getting Transaction history !",
            false,
            true
        );
    }
}





module.exports = {
    TotalUserCard,
    TotalSocialCard,
    getMonthlyUserCountsByYear,
    SocialtypeCard,
    countryWiseUser,
    platformCard,
    TotalLiveCard,
    TotalIncomeCard,
    loginTypeCard
}