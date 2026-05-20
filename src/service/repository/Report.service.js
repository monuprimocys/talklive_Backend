const { Report } = require("../../../models");

const getReports = async (
    filterPayload = {},
    pagination = { page: 1, pageSize: 10 },
    include = [], // default to empty array if not provided,
    order = [['createdAt', 'DESC']] // default to empty array if not provided
) => {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (page - 1) * pageSize;
        
        const { rows, count } = await Report.findAndCountAll({
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




async function getReport(reprtPayload) {
    // Perform the query with the "OR" conditions
    const is_report = await Report.findOne({
        where: {
            reprtPayload
        }
    });
    return is_report;
}

async function createReportUser(reportPayload) {
    try {

        const newReportUser = await Report.create(reportPayload);
        return newReportUser;
    } catch (error) {
        console.error('Error creating report user:', error);
        throw error;
    }
}
async function updateReportUser(reportPayload, condition) {
    try {
        const newReportUser = await Report.update(reportPayload, { where: condition });
        return newReportUser;
    } catch (error) {
        console.error('Error updating report User:', error);
        throw error;
    }
}

module.exports = {
    getReports,
    getReports,
    createReportUser,
    updateReportUser,
};