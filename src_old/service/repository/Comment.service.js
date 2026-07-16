const { Op } = require('sequelize');

const { Comment } = require("../../../models");
const { getLike } = require('./Like.service');


async function createComment(commentPayload) {
    try {
        const newComment = await Comment.create(commentPayload);
        return newComment;
    } catch (error) {
        console.error('Error in comment', error);
        throw error;
    }
}

async function getComment(commentPayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);


        // Build the query object
        const query = {
            where: {
                ...commentPayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
            order: [
                ['createdAt', 'DESC'], // Sorting by 'createdAt' in descending order
            ],
        };
        
        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Comment.findAndCountAll(query);
        
        const rowsWithReplyCount = await Promise.all(
            rows.map(async (comment) => {
                const replyCount = await Comment.count({
                    where: { comment_ref_id: comment.dataValues.comment_id },
                });
                
                const likes  = await getLike({comment_id:comment.dataValues.comment_id})
                const commentData = comment.get();

                if (commentData.commenter) {
                    commentData.commenter = comment.commenter.get();
                }

                commentData.reply_count = replyCount;
                commentData.like_count = likes.Pagination.total_records;

                return commentData;
            })
        );

        // Prepare the structured response
        return {
            Records: rowsWithReplyCount,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error("Error in fetching Comments:", error);
        throw error;
    }
}


async function updateComent(commentPayload, condition) {
    try {
        const updatedComment = await Comment.update(commentPayload, { where: condition });
        return updatedComment;
    } catch (error) {
        console.error('Error in update Comment', error);
        throw error;
    }
}

async function deleteComment(commentPayload) {
    try {
        const unComment = await Comment.destroy({ where: commentPayload });
        return unComment;
    } catch (error) {
        console.error('Error in Deleting Comment', error);
        throw error;
    }
}


module.exports = {
    createComment,
    updateComent,
    deleteComment,
    getComment
};


