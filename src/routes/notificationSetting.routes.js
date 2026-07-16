const { Router } = require("express");

const {authMiddleware} = require('../middleware/authMiddleware');


const {
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controller/notificationSetting.controller");

const router = Router();
router.use(authMiddleware)

// GET
router.get("/", getNotificationSettings);

// PUT
router.put("/", updateNotificationSettings);

module.exports = router;