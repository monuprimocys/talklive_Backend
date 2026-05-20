const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const avatar_controller = require('../controller/Admin_controller/Avatar.Controller');

const router = express.Router();

router.use(authMiddleware)
// No Auth Routes
router.post('/show-avatars', avatar_controller.showAvatars);



module.exports = router;