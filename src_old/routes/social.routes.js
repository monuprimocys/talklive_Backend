const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const social_controller = require('../controller/social_controller/social.controller');

const router = express.Router();

// No Auth Social Routes

// Auth Social Routes
router.post('/get-social-noauth', social_controller.showSocialswithoutauth);

router.use(authMiddleware)

router.post('/upload-social', social_controller.uploadSocial);
router.post('/upload-media-in-s3', social_controller.uploadMediaS3);
router.post('/get-presigned-url', social_controller.getPresignedUrl);
router.post('/get-social', social_controller.showSocials);
router.post('/get-social-of-followers', social_controller.getSocialsOfFollowers);
router.post('/delete-social', social_controller.deleteSocials);
router.post('/add-views', social_controller.addViews);
router.post('/edit-social', social_controller.editSocial);
router.post('/search-social', social_controller.searchSocials);
router.post('/search-social-by-location', social_controller.searchSocialsByLocation);
router.post('/pin-unpin', social_controller.pin_unpin);

module.exports = router;