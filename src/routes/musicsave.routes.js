const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const musicsave_controller = require('../controller/musicsave_controller/musicsave.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/music-save-unsave', musicsave_controller.music_save_unsave);
router.post('/music-save-list', musicsave_controller.music_save_list);

module.exports = router;