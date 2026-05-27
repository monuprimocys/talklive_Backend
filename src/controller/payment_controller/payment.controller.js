const { generalResponse } = require("../../helper/response.helper");
const PaymentService = require("../../service/payment/payment.service");

/**
 * Payment Controller
 * Handles payment requests and webhook callbacks
 */

/**
 * Create a coin purchase payment
 * POST /api/payment/create
 * Body: { coins: number, currency: string, amount_usd: number }
 */
async function createPayment(req, res) {
  try {
    const user_id = req.authData.user_id;
    const { coins, currency, amount_usd, plan_id, payment_method } = req.body;

    // Validate request body
    if (!plan_id && (!coins || !currency || !amount_usd)) {
      return generalResponse(
        res,
        { success: false },
        "Missing required fields: plan_id or (coins, currency, amount_usd)",
        false,
        true
      );
    }

    console.log("[PaymentController] Create payment request:", {
      user_id,
      plan_id,
      coins,
      currency,
      amount_usd,
      payment_method
    });

    const result = await PaymentService.createPayment(
      user_id,
      coins,
      currency,
      amount_usd,
      plan_id,
      payment_method
    );

    if (!result.success) {
      return generalResponse(
        res,
        { success: false, error_code: result.error_code },
        result.message,
        false,
        result.error_code === "USER_NOT_FOUND" // Show auth error for user not found
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: result.data,
      },
      result.message,
      true,
      false
    );
  } catch (error) {
    console.error("[PaymentController] Create payment error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error creating payment",
      false,
      true
    );
  }
}

/**
 * Handle NOWPayments webhook callback
 * POST /api/payment/webhook
 * Headers: X-NOWPAYMENTS-SIG (signature)
 */
async function handleWebhook(req, res) {
  try {
    const payload = req.body;
    const signature = req.headers["x-nowpayments-sig"];

    console.log("[PaymentController] Webhook received:", {
      payment_id: payload.payment_id,
      order_id: payload.order_id,
      status: payload.payment_status,
      has_signature: !!signature,
    });

    // Validate signature header exists
    if (!signature) {
      console.warn("[PaymentController] Missing webhook signature");
      return res.status(401).json({
        success: false,
        message: "Missing webhook signature",
      });
    }

    // Process webhook
    const result = await PaymentService.handleWebhook(payload, signature);

    if (!result.success && result.error_code === "INVALID_SIGNATURE") {
      return res.status(401).json(result);
    }

    // Return 200 OK for all valid requests (duplicate or already processed)
    return res.status(200).json({
      success: true,
      message: result.message,
      is_duplicate: result.is_duplicate || false,
    });
  } catch (error) {
    console.error("[PaymentController] Webhook processing error:", error);
    // Still return 200 to avoid webhook retry loops
    return res.status(200).json({
      success: false,
      message: "Webhook processing error",
      error: error.message,
    });
  }
}

/**
 * Get payment status
 * GET /api/payment/status/:purchase_id
 */
async function getPaymentStatus(req, res) {
  try {
    const { purchase_id } = req.params;
    const user_id = req.authData.user_id;

    if (!purchase_id) {
      return generalResponse(
        res,
        { success: false },
        "Missing purchase_id parameter",
        false,
        true
      );
    }

    // Verify ownership
    const db = require("../../../models");
    const order = await db.CoinPurchaseOrder.findByPk(purchase_id);

    if (!order) {
      return generalResponse(
        res,
        { success: false },
        "Payment not found",
        false,
        true
      );
    }

    if (order.user_id !== user_id) {
      return generalResponse(
        res,
        { success: false },
        "Unauthorized",
        false,
        true
      );
    }

    const result = await PaymentService.getPaymentStatus(purchase_id);

    if (!result.success) {
      return generalResponse(
        res,
        { success: false },
        result.message,
        false,
        true
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: result.data,
      },
      "Payment status retrieved",
      true,
      false
    );
  } catch (error) {
    console.error("[PaymentController] Get payment status error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching payment status",
      false,
      true
    );
  }
}

/**
 * Get user's payment history
 * GET /api/payment/history?limit=10
 */
async function getPaymentHistory(req, res) {
  try {
    const user_id = req.authData.user_id;
    const limit = req.query.limit || 10;

    const result = await PaymentService.getUserPaymentHistory(user_id, limit);

    if (!result.success) {
      return generalResponse(
        res,
        { success: false },
        result.message,
        false,
        true
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: result.data,
      },
      "Payment history retrieved",
      true,
      false
    );
  } catch (error) {
    console.error("[PaymentController] Get payment history error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching payment history",
      false,
      true
    );
  }
}

module.exports = {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
};
