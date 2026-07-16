const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const musiccategory_controller = require('../controller/musiccategory_controller/musiccategory.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/category/list', musiccategory_controller.showMusicCategory);
router.post('/category/music', musiccategory_controller.showMusicByCategory);
router.post('/search-music', musiccategory_controller.searchMusic);

module.exports = router;