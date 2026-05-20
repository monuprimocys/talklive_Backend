const express = require('express');
const { signupUser, OtpVerification } = require('../controller/user_controller/auth.controller');
const { updateProfile } = require('../controller/user_controller/updateProfile.controller');
const {authMiddleware} = require('../middleware/authMiddleware');
const { findUser } = require('../controller/user_controller/User.Controller');
const { findHashtags, create_Hashtag } = require('../controller/Hashtag.Controller');
const router = express.Router();

// No Auth User Routes

// auth
router.post('/get-hashtags', findHashtags);
router.use(authMiddleware)
router.post('/create-hashtags', create_Hashtag);



// Admin routes
module.exports = router;