const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const { Product, Product_Media, User } = require("../../../models");


async function createProduct(productPayload) {
    try {
        const newProduct = await Product.create(productPayload);
        return newProduct;
    } catch (error) {
        console.error('Error creating Product:', error);
        throw error;
    }
}

async function getProduct(productPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...productPayload }; // Default to the provided payload

        // Check if 'user_id' is not provided, and apply exclusion only if excludedUserIds is not empty
        if (!productPayload.user_id && excludedUserIds.length > 0) {
            wherecondition.user_id = {
                [Op.notIn]: excludedUserIds, // Exclude user_ids from the list
            };
        }

        // Check if 'product_title' is provided in the payload and apply LIKE search
        if (productPayload.product_title) {
            wherecondition.product_title = {
                [Op.like]: `${productPayload.product_title}%`, // Apply LIKE condition for product title
            };
        }


        // Prepare the query with pagination and include necessary models
        const query = {
            where: wherecondition,
            limit,
            offset,
            include: [
                {
                    model: Product_Media, // Ensure Product_Media model is included correctly
                },
                {
                    model: User, // Ensure User model is included correctly
                    attributes: {
                        exclude: [
                            "password",
                            "otp",
                            "social_id",
                            "id_proof",
                            "selfie",
                            "device_token",
                            "email",
                            "dob",
                            "country_code",
                            "mobile_num",
                            "login_type",
                            "gender",
                            "state",
                            "city",
                            "bio",
                            "login_verification_status",
                            "is_private",
                            "is_admin"
                        ],
                    },
                }
            ],
            order: [
                ['createdAt', 'DESC'], // Ensure sorting by creation date
            ],
        };

        // Fetch products with the given query
        const { rows, count } = await Product.findAndCountAll(query);

        // Return the structured response with pagination
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
        console.error('Error fetching Products:', error);
        throw error;
    }
}

async function updateProduct(productPayload, updateData) {
    try {


        // Use the update method to update the records
        const [updatedCount] = await Product.update(updateData, { where: productPayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Product:', error);
        throw error;
    }
}

async function deleteProduct(productPayload) {
    try {
        // Use the destroy method to delete the records
        const deletedCount = await Product.destroy({ where: productPayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Product:', error);
        throw error;
    }
}




module.exports = {
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}