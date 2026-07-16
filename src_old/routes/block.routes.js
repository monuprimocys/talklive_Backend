const express = require('express');

const block_controller = require('../controller/block_controller/block.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/block-unblock', block_controller.block_unblock);
router.post('/block-list', block_controller.block_list);

module.exports = router;