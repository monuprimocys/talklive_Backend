const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const gift_controller = require('../controller/Admin_controller/Gift_controller/Gift.controller');
const { isAdmin } = require('../service/repository/Admin.service');

const router = express.Router();

// No Auth Social Routes

// Auth Routes
router.use(authMiddleware)

router.post('/get-gift-category', gift_controller.showGiftCategory);
router.post('/get-gift', gift_controller.showGift);



module.exports = router;