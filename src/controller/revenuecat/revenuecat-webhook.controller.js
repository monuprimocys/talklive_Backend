const { RevenueCatWebhookService } = require("../../service/revenuecat/revenuecat-webhook.service");

class RevenueCatWebhookController {
  static async handle(req, res) {
    console.log("RC Webhook received", req.body);

    // Verify HMAC signature using the raw body buffer attached by the middleware
    const rawBody = req.rawBody;
    if (!rawBody) {
      console.error("[RC Webhook] rawBody not available — check middleware order");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    console.log("Authorization Header:", req.headers.authorization);
console.log(
  "Webhook Secret Exists:",
  !!process.env.REVENUECAT_WEBHOOK_SECRET
);
console.log(
  "Secret Length:",
  process.env.REVENUECAT_WEBHOOK_SECRET?.length
);

    const authHeader = req.headers["authorization"];
    const isValid = RevenueCatWebhookService.verifySignature(rawBody, authHeader);

    console.log("RC Webhook signature verification result", isValid);

    if (!isValid) {
      console.warn("[RC Webhook] Signature verification failed");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("RC Webhook signature verification passed");

    // Respond 200 immediately so RC does not retry while we process
    res.status(200).json({ success: true, message: "Webhook received" });

    // Process asynchronously — RC considers 2xx a success regardless of body
    const payload = req.body;

    console.log("RC Webhook payload", payload);

    console.log("APP USER ID:", payload.event.app_user_id);
console.log("EVENT TYPE:", payload.event.type);
console.log("PRODUCT ID:", payload.event.product_id);

    if (!payload?.event?.id || !payload?.event?.type) {
      console.warn("[RC Webhook] Malformed payload — missing event.id or event.type");
      return; // already responded
    }

    console.log("RC Webhook processing event", payload?.event?.id);

    RevenueCatWebhookService.processEvent(payload).catch((err) => {
      console.error(`[RC Webhook] Async processing failed for event ${payload?.event?.id}:`, err);
    });
  }
}

module.exports = { RevenueCatWebhookController };