const { ReportedSocials } = require("../../../models");

const getSocialReports = async (
    filterPayload = {},
    pagination = { page: 1, pageSize: 10 },
    include = [], // default to empty array if not provided
    order = [['createdAt', 'DESC']] // default to empty array if not provided
) => {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (page - 1) * pageSize;

        const { rows, count } = await ReportedSocials.findAndCountAll({
            where: filterPayload,
            include, // dynamic associations
            offset,
            limit: pageSize,
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
        console.log(error);
        throw new Error("Could not retrieve reports");
    }
};

async function getSocialReport(reprtPayload) {
    // Perform the query with the "OR" conditions
    const is_report = await ReportedSocials.findOne({
        where: {
            reprtPayload
        }
    });
    return is_report;
}

async function createReportsocial(reportPayload) {
    try {
        
        const newReportSocail = await ReportedSocials.create(reportPayload);
        return newReportSocail;
    } catch (error) {
        console.error('Error creating report social:', error);
        throw error;
    }
}
async function updateReportSocial(reportPayload, condition) {
    try {
        const newReportSocail = await ReportedSocials.update(reportPayload, { where: condition });
        return newReportSocail;
    } catch (error) {
        console.error('Error updating report Socail:', error);
        throw error;
    }
}

module.exports = {
    getSocialReport,
    getSocialReports,
    createReportsocial,
    updateReportSocial,
};