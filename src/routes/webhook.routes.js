const { Router } = require("express");
const { RevenueCatWebhookController } = require("../controller/revenuecat/revenuecat-webhook.controller");

const router = Router();

// rawBody is captured by the global express.json() verify callback in server.ts
router.post("/revenuecat", RevenueCatWebhookController.handle);

module.exports = { webhookRoutes: router };
