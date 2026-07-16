const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const report_User_controller = require('../controller/report_controller/Report_user.controller');
const report_types_controller = require('../controller/report_controller/Report_types.controller');
const report_social_controller = require('../controller/report_controller/Report_social.controller');
const { isAdmin } = require('../service/repository/Admin.service');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/report-user', report_User_controller.uploadReportUser);
router.post('/report-types', report_types_controller.showReportTypes);
router.post('/report-social', report_social_controller.uploadReportSocial);



module.exports = router;