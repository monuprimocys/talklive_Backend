const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const music_controller = require('../controller/Admin_controller/Music_controller/Music.controller');

const router = express.Router();

// No Auth Social Routes

// Auth Social Routes
router.use(authMiddleware)
router.post('/get-music', music_controller.showMusic);




module.exports = router;