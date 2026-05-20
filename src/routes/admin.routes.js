const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { login_admin } = require('../controller/Admin_controller/auth.Controller');
const { update_admin } = require('../controller/Admin_controller/admin.details.controller');
const { isAdmin } = require('../service/repository/Admin.service');
const router = express.Router();
const gift_controller = require('../controller/Admin_controller/Gift_controller/Gift.controller');
const user_controller = require('../controller/user_controller/User.Controller');
const user_update_controller = require('../controller/user_controller/updateProfile.controller');
const report_User_controller = require('../controller/report_controller/Report_user.controller');
const report_Social_controller = require('../controller/report_controller/Report_social.controller');
const report_types_controller = require('../controller/report_controller/Report_types.controller');
const social_controller = require('../controller/social_controller/social.controller');
const save_controller = require('../controller/save_controller/save.controller');
const hashtag_controller = require('../controller/Hashtag.Controller');
const comment_controller = require('../controller/comment_controller/comment.controller');
const like_controller = require('../controller/like_controller/like.controller');
const transaction_controller = require('../controller/Transaction_controller/transaction.controller');
const transaction_controller_admin = require('../controller/Admin_controller/Transaction_controller/transaction.controller');
const follow_controller = require('../controller/follow_controller/follow.controller');
const live_controller = require('../controller/Live_controller/Live.controller');
const dashboard_controller = require('../controller/Admin_controller/Dashboard_controller/Dashbard.controller');
const block_controller = require('../controller/block_controller/block.controller');
const avatar_controller = require('../controller/Admin_controller/Avatar.Controller');
const language_controller = require('../controller/Admin_controller/Language.controller');
const project_config = require('../controller/Admin_controller/ProjectConf.controller');
const music_controller = require('../controller/Admin_controller/Music_controller/Music.controller');
const notification_controller = require('../controller/Admin_controller/Pushnotification.controller');

// No Auth User Routes

router.post('/login', login_admin);

// auth routes
router.use(authMiddleware)
router.use(isAdmin)

// Profile Routes
router.post('/update-profile', update_admin);


// Dashboard 
router.post('/total-user-card', dashboard_controller.TotalUserCard);
router.post('/total-social-card', dashboard_controller.TotalSocialCard);
router.post('/monthly-user-by-year', dashboard_controller.getMonthlyUserCountsByYear);
router.post('/social-type-card', dashboard_controller.SocialtypeCard);
router.post('/countrysie-user', dashboard_controller.countryWiseUser);
router.post('/platform-data-card', dashboard_controller.platformCard);
router.post('/total-live-card', dashboard_controller.TotalLiveCard);
router.post('/total-income-card', dashboard_controller.TotalIncomeCard);
router.post('/login-type-card', dashboard_controller.loginTypeCard);


// Gift Routes 
router.post('/gift-category', gift_controller.uploadGiftCategory);
router.put('/gift-category', gift_controller.edit_Gift_Category);
router.put('/gift', gift_controller.edit_Gift);
router.post('/gift', gift_controller.uploadGift);


// User Routs 
router.post('/get-user', user_controller.findUser_Admin);
router.post('/update-user', user_update_controller.updateProfileAdmin);

// Block Routes
router.post('/block-list', block_controller.block_list_admin);


// Report routes
router.post('/add-reports', report_types_controller.uploadReportTypes);
router.post('/reported-user-list', report_User_controller.showReportUser);
router.post('/reported-social-list', report_Social_controller.showReportSocials);

// Social Routes 
router.post('/get-social-admin', social_controller.showSocialsAdmin);
router.post('/update-social-admin', social_controller.updateSocialsAdmin);

// Save Routes 
router.post('/saved-list', save_controller.save_list_admin);

// hashtag routes 
router.post('/create-hashtag', hashtag_controller.create_Hashtag);


// Live Routes
router.post('/live-list', live_controller.get_live_admin);

// Follow Routes 
router.post('/follow-following-list', follow_controller.follow_follower_list_admin);

// Comment Routes
router.post('/show-comment', comment_controller.comment_list_admin);

// Like Routes
router.post('/like-list', like_controller.like_list_admin);

// Avatar Routes
router.post('/upload-avatar', avatar_controller.uploadAvatar);
router.post('/update-avatar', avatar_controller.updateAvatars);

// Language Routes
router.post('/add-language', language_controller.add_new_language);
router.put('/update-language', language_controller.update_Language);
router.post('/translate-all-keywords', language_controller.translate_all_keywords);
router.post('/translate-single-keyword', language_controller.translate_single_keywords);

// Transaction Routes
router.post('/transaction-history', transaction_controller.Transaction_history_admin);
router.post('/add-transaction-plan', transaction_controller_admin.add_transaction_plan);
router.post('/update-transaction-plan', transaction_controller_admin.update_transaction_plan);
router.post('/approve-transaction', transaction_controller_admin.approve_transaction);
router.post('/update-transaction-conf', transaction_controller.update_transaction_conf_data);

// Project Config Routes
router.put('/update-project-conf', project_config.update_Config);
router.post('/deactivate', project_config.deactivate);

// Music Routes 
router.post('/upload-music', music_controller.uploadMusic);
// router.post('/delete-music', music_controller.delete_Music);
router.post('/update-music', music_controller.update_Music);

// Notification Routes
router.post('/send-broadcast-notification', notification_controller.broadcastMessage);
router.post('/list-broadcast-notification', notification_controller.getbroadcastMessage);
module.exports = router;