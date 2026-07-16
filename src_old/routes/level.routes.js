const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const level_controller = require("../controller/level_controller/level_controller");

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.get('/levels', level_controller.getLevels);
module.exports = router;