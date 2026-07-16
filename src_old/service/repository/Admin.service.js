const { Op } = require('sequelize');

const { Admin } = require("../../../models");
const { generalResponse } = require('../../helper/response.helper');


const getAdmins = async (filterPayload = {}, pagination = { page: 1, pageSize: 10 }, attributes = [], excludedUserIds) => {
    try {
        
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Initialize the where condition object
        const whereCondition = {};
        const include = [];

    
        // Dynamically add conditions to the where clause based on the provided filterPayload
     
        if (filterPayload.email) {
            whereCondition.email = filterPayload.email; // Exact match for email
        }
        
        if (filterPayload.admin_id) {
            whereCondition.admin_id = filterPayload.admin_id; // Exact match for user ID
        }
  
  


        let { rows, count } = await Admin.findAndCountAll({
            where: whereCondition,
            attributes: attributes.length ? attributes : undefined, // Ensure all columns are selected if `attributes` is empty
            limit,
            offset,
            include,
            order: [['createdAt', 'DESC']], // Order by most recently created
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
        console.error('Error fetching Admins:', error);
        throw new Error('Could not retrieve Admins');
    }
};



async function getAdmin(adminPayload) {
    // Create an array to store the conditions for the "OR" query  
    // const orConditions = [];

    // // Dynamically add conditions based on the provided payload


    // if (adminPayload.email) {
    //     orConditions.push({ email: adminPayload.email });
    // }get_transaction_plan
    //     return null;
    // }

    // Perform the query with the "OR" conditions
    const isAdmin = await Admin.findOne({
        where: adminPayload
    });

    return isAdmin;
}



async function updateAdmin(adminPayload, condition) {
    try {
        if(adminPayload?.filteredData){
            adminPayload = adminPayload.filteredData
        }

        const updatedAdmin = await Admin.update(adminPayload, { where: condition });
        
        return updatedAdmin;
    } catch (error) {
        console.error('Error updating Admin:', error);
        throw error;
    }
}

const isAdmin = (req, res, next) => {
    
    if (req.user_type !== "admin") {
        return generalResponse(
            res,
            {},
            "Unauthorized",
            false,
            true,
            401
        );
    }
    next();
};

module.exports = {
    getAdmin,
    getAdmins,
    updateAdmin,
    isAdmin
};