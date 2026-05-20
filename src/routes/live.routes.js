const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const live_controller = require('../controller/Live_controller/Live.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

// router.post('/live-list', live_controller.get_live);
router.post('/live-list', live_controller.get_live_with_hosts);
router.post('/live-list-values', live_controller.get_live_with_hosts_id);

module.exports = router;