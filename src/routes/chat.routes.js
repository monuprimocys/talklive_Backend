const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

const message_controller_api = require('../controller/chat_controller/Message.cotroller.api');
const { forwardMessage } = require('../controller/chat_controller/forward_message.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

// ✅ Changed to upload.any() to support both 'files' and 'file_media_1/2' field names
router.post("/send-message", upload.any(), message_controller_api.sendMessage);
router.post("/forward-message", forwardMessage);


module.exports = router;
