const { Op } = require('sequelize');

const { Report_type } = require("../../../models");

const getReport_types = async () => {
    try {
        const report_types = await Report_type.findAll();
        return report_types;
    } catch (error) {
        console.log(error);
        throw new Error("Could not retrieve report types");
    }
};

async function getReport_type(reprtTypePayload) {
    const is_report_type = await Report_type.findOne({
        where: reprtTypePayload
    });
    
    return is_report_type;
}

async function createReportTypes(reprtTypePayload) {
    try {
        const newReporttypes = await Report_type.create(reprtTypePayload);
        return newReporttypes;
    } catch (error) {
        console.error('Error creating report type:', error);
        throw error;
    }
}
async function updateReportTypes(reprtTypePayload, condition) {
    try {
        const newReporttypes = await Report_type.update(reprtTypePayload, { where: condition });
        return newReporttypes;
    } catch (error) {
        console.error('Error updating report type:', error);
        throw error;
    }
}




module.exports = {
    getReport_types,
    getReport_type,
    createReportTypes,
    updateReportTypes
};