const { Router } = require("express");
const {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentStatusByOrderId,
} = require("../controller/payment_controller/payment.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();

/**
 * Payment Routes
 * BASE: /api/payment
 */

/**
 * Create coin purchase payment
 * POST /api/payment/create
 * Requires: authentication
 * Body: { coins, currency, amount_usd }
 */
router.post("/create", authMiddleware, createPayment);

/**
 * NOWPayments webhook callback
 * POST /api/payment/webhook
 * No authentication required (uses signature validation)
 * Headers: X-NOWPAYMENTS-SIG
 */
router.post("/webhook", handleWebhook);

/**
 * Get payment status by purchase_id
 * GET /api/payment/status/:purchase_id
 * Requires: authentication
 */
router.get("/status/:purchase_id", authMiddleware, getPaymentStatus);

/**
 * Get payment status by order_id (for frontend polling)
 * GET /api/payment/status-by-order/:order_id
 * Requires: authentication
 */
router.get("/status-by-order/:order_id", authMiddleware, getPaymentStatusByOrderId);

/**
 * Get payment history
 * GET /api/payment/history?limit=10
 * Requires: authentication
 */
router.get("/history", authMiddleware, getPaymentHistory);

module.exports = router;
