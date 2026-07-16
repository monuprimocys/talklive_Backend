const express = require('express');
const { signupUser, OtpVerification } = require('../controller/user_controller/auth.controller');
const { updateProfile, getPresignedUrl, getProfilePresignedUrl, } = require('../controller/user_controller/updateProfile.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { findUser, get_notificationList, update_notificationList, findUser_no_auth, findUser_not_following, getPremiumStatus, get_notificationCount } = require('../controller/user_controller/User.Controller');
const router = express.Router();

// No Auth User Routes
router.post('/signup', signupUser);
router.post('/verfyOtp', OtpVerification);
router.post('/find-user-no-auth', findUser_no_auth);

router.use(authMiddleware)
// Auth User Routes
router.post('/updateUser', updateProfile);
router.post('/find-user', findUser);
router.post('/find-user-not-following', findUser_not_following);

// Notification List
router.post('/get-notification-list', get_notificationList);
router.post('/update-notification-list', update_notificationList);
router.post('/get-presigned-url', authMiddleware, getPresignedUrl);
router.post('/get-profile-presigned-url', getProfilePresignedUrl);
router.post('/notification-count', get_notificationCount);



// Premium Status
router.post('/get-premium-status', getPremiumStatus);


// Admin routes
router.post('')
module.exports = router;