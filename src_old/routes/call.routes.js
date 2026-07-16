const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { makeCall } = require('../controller/call_controller/make_call.controller');

const router = express.Router();

// Auth follow Routes
router.use(authMiddleware)

router.post('/make-call', makeCall);


module.exports = router;