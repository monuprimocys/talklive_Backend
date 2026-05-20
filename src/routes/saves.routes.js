const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const save_cntroller = require('../controller/save_controller/save.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/save-unsave', save_cntroller.save_unsave);
router.post('/saved-list', save_cntroller.save_list);

module.exports = router;