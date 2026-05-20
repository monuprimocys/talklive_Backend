const express = require('express');

const {authMiddleware} = require('../middleware/authMiddleware');

const commentController = require('../controller/comment_controller/comment.controller');

const router = express.Router();


router.use(authMiddleware)


router.post('/add-comment', commentController.toComment);
router.post('/show-comment', commentController.comment_list);


module.exports = router;