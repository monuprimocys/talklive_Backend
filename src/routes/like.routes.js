const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const like_controller = require('../controller/like_controller/like.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/like-unlike', like_controller.like_unlike);
router.post('/like-list', like_controller.like_list);
router.post('/users-like-count', like_controller.user_like_count);

module.exports = router;