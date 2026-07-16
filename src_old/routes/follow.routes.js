const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const follow_controller = require('../controller/follow_controller/follow.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/follow-unfollow', follow_controller.follow_unfollow);
router.post('/follow-following-list', follow_controller.follow_follower_list);

module.exports = router;