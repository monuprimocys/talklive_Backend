const axios = require("axios");
const crypto = require("crypto");
const db = require("../../../models");
const PaymentRepository = require("../repository/Payment.repository");

/**
 * Payment Service Layer
 * Handles business logic for NOWPayments integration
 */
class PaymentService {
  constructor() {
    this.API_KEY = process.env.NOWPAYMENTS_API_KEY;
    this.IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
    this.API_URL = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";
    this.baseUrl = process.env.baseUrl || "http://localhost:3000";
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    if (!this.API_KEY) {
      throw new Error("NOWPAYMENTS_API_KEY not configured");
    }
    if (!this.IPN_SECRET) {
      throw new Error("NOWPAYMENTS_IPN_SECRET not configured");
    }
  }

  /**
   * Create a payment request
   */
  async createPayment(userId, coins, currency, amountUsd, planId = null) {
    const transaction = await db.sequelize.transaction();

    try {
      this.validateConfig();

      // Validate user exists
      const user = await PaymentRepository.getUserWithLock(userId, transaction);
      if (!user) {
        await transaction.rollback();
        return {
          success: false,
          message: "User not found",
          error_code: "USER_NOT_FOUND",
        };
      }

      let finalCoins = coins;
      let finalAmountUsd = amountUsd;
      let finalCurrency = currency;

      // If planId is provided, fetch plan details
      if (planId) {
        const plan = await db.Transaction_plan.findByPk(planId, { transaction });
        if (!plan) {
          await transaction.rollback();
          return {
            success: false,
            message: "Transaction plan not found",
            error_code: "PLAN_NOT_FOUND",
          };
        }
        finalCoins = plan.coins;
        finalAmountUsd = plan.corresponding_money;
        // Use provided currency if available, otherwise use plan currency
        finalCurrency = currency || plan.currency || "BTC";
      }

      // Validate inputs
      if (!finalCoins || finalCoins < 1) {
        await transaction.rollback();
        return {
          success: false,
          message: "Coins must be at least 1",
          error_code: "INVALID_COINS",
        };
      }

      if (finalAmountUsd < 0.01) {
        await transaction.rollback();
        return {
          success: false,
          message: "Amount must be at least $0.01",
          error_code: "INVALID_AMOUNT",
        };
      }

      const validCurrencies = ["BTC", "ETH", "USDT", "USD"];
      if (!validCurrencies.includes(finalCurrency.toUpperCase())) {
        await transaction.rollback();
        return {
          success: false,
          message: `Currency must be one of: ${validCurrencies.join(", ")}`,
          error_code: "INVALID_CURRENCY",
        };
      }

      // Generate order ID
      const orderId = `ORD-${userId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create payment with NOWPayments API
      const nowPaymentPayload = {
        price_amount: finalAmountUsd,
        price_currency: "usd",
        pay_currency: finalCurrency.toLowerCase(),
        order_id: orderId,
        order_description: `Purchase ${finalCoins} coins`,
        ipn_callback_url: `${this.baseUrl}/api/payment/webhook`,
        success_url: `${this.baseUrl}/payment/success?order_id=${orderId}`,
        cancel_url: `${this.baseUrl}/payment/cancel?order_id=${orderId}`,
      };

      console.log("[PaymentService] Creating NOWPayments request:", {
        order_id: orderId,
        price_amount: finalAmountUsd,
        currency: finalCurrency,
        plan_id: planId
      });

      const nowPaymentResponse = await axios.post(
        `${this.API_URL}/invoice`,
        nowPaymentPayload,
        {
          headers: {
            "x-api-key": this.API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const paymentData = nowPaymentResponse.data;

      console.log("[PaymentService] NOWPayments response:", {
        payment_id: paymentData.id || paymentData.payment_id,
        status: paymentData.status,
      });

      // Create order in database
      const purchaseOrder = await PaymentRepository.createCoinPurchaseOrder(
        {
          user_id: userId,
          order_id: orderId,
          payment_id: paymentData.id || paymentData.payment_id || null,
          coins: finalCoins,
          amount_usd: finalAmountUsd,
          currency: finalCurrency,
          pay_currency: paymentData.pay_currency || finalCurrency.toLowerCase(),
          pay_amount: paymentData.pay_amount || null,
          status: "PENDING",
          payment_address: paymentData.payment_address || null,
          plan_id: planId, // Added plan_id to track which plan was purchased
          ipn_callback_url: nowPaymentPayload.ipn_callback_url,
          success_url: nowPaymentPayload.success_url,
          cancel_url: nowPaymentPayload.cancel_url,
        },
        transaction
      );

      await transaction.commit();

      return {
        success: true,
        message: "Payment created successfully",
        data: {
          purchase_id: purchaseOrder.purchase_id,
          order_id: orderId,
          payment_id: paymentData.id || paymentData.payment_id,
          payment_url: paymentData.invoice_url || paymentData.payment_url,
          pay_currency: paymentData.pay_currency,
          pay_amount: paymentData.pay_amount,
          status: purchaseOrder.status,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("[PaymentService] Payment creation error:", error.message);

      if (error.response?.data) {
        console.error("[PaymentService] NOWPayments error details:", error.response.data);
        return {
          success: false,
          message: error.response.data.message || "Payment creation failed",
          error_code: "NOWPAYMENTS_ERROR",
        };
      }

      return {
        success: false,
        message: "Failed to create payment",
        error_code: "PAYMENT_CREATION_ERROR",
      };
    }
  }

  /**
   * Validate webhook signature
   * @param {object} payload - Webhook payload
   * @param {string} signature - Signature from header
   * @returns {boolean} - Whether signature is valid
   */
  validateWebhookSignature(payload, signature) {
    try {
      // Sort keys alphabetically to ensure consistent stringification
      const sortedPayload = {};
      Object.keys(payload)
        .sort()
        .forEach((key) => {
          sortedPayload[key] = payload[key];
        });

      const message = JSON.stringify(sortedPayload);
      const hash = crypto
        .createHmac("sha512", this.IPN_SECRET)
        .update(message)
        .digest("hex");

      return hash === signature;
    } catch (error) {
      console.error("[PaymentService] Signature validation error:", error);
      return false;
    }
  }

  /**
   * Handle payment webhook callback
   * @param {object} payload - Webhook payload from NOWPayments
   * @param {string} signature - Signature from webhook header
   * @returns {object} - Webhook processing result
   */
  async handleWebhook(payload, signature) {
    const transaction = await db.sequelize.transaction();

    try {
      this.validateConfig();

      const paymentId = payload.payment_id;
      const orderId = payload.order_id;
      const status = payload.payment_status;

      console.log("[PaymentService] Webhook received:", {
        payment_id: paymentId,
        order_id: orderId,
        status: status,
      });

      // Validate signature
      const signatureValid = this.validateWebhookSignature(payload, signature);

      if (!signatureValid) {
        console.warn(
          "[PaymentService] Invalid webhook signature for payment:",
          paymentId
        );

        // Log invalid webhook
        await PaymentRepository.logWebhook({
          payment_id: paymentId,
          order_id: orderId,
          webhook_type: "payment_status_changed",
          request_body: payload,
          signature_valid: false,
          signature_received: signature,
          status: "INVALID",
        });

        await transaction.commit();
        return {
          success: false,
          message: "Invalid webhook signature",
          error_code: "INVALID_SIGNATURE",
        };
      }

      // Check for duplicate webhook
      const existingWebhook = await PaymentRepository.findDuplicateWebhook(paymentId);
      if (existingWebhook) {
        console.log(
          "[PaymentService] Duplicate webhook detected for payment:",
          paymentId
        );

        // Log duplicate
        await PaymentRepository.logWebhook({
          payment_id: paymentId,
          order_id: orderId,
          webhook_type: "payment_status_changed",
          request_body: payload,
          signature_valid: true,
          status: "DUPLICATE",
        });

        await transaction.commit();
        return {
          success: true,
          message: "Webhook already processed",
          is_duplicate: true,
        };
      }

      // Find payment order
      const order = await db.CoinPurchaseOrder.findOne(
        {
          where: { payment_id: paymentId },
        }
        // Note: transaction support varies
      );

      if (!order) {
        console.error("[PaymentService] Payment order not found:", paymentId);

        await PaymentRepository.logWebhook({
          payment_id: paymentId,
          order_id: orderId,
          webhook_type: "payment_status_changed",
          request_body: payload,
          signature_valid: true,
          status: "ERROR",
          processing_error: "Payment order not found in database",
        });

        await transaction.commit();
        return {
          success: false,
          message: "Payment order not found",
          error_code: "ORDER_NOT_FOUND",
        };
      }

      // Get user
      const user = await PaymentRepository.getUserWithLock(order.user_id, transaction);
      if (!user) {
        console.error("[PaymentService] User not found:", order.user_id);

        await PaymentRepository.logWebhook({
          purchase_id: order.purchase_id,
          payment_id: paymentId,
          order_id: orderId,
          webhook_type: "payment_status_changed",
          request_body: payload,
          signature_valid: true,
          status: "ERROR",
          processing_error: "User not found",
        });

        await transaction.commit();
        return {
          success: false,
          message: "User not found",
          error_code: "USER_NOT_FOUND",
        };
      }

      // Process based on payment status
      let result;

      if (status === "finished") {
        result = await this._processConfirmedPayment(
          order,
          user,
          payload,
          transaction
        );
      } else if (status === "failed" || status === "cancelled") {
        result = await this._processFailedPayment(
          order,
          payload,
          transaction
        );
      } else if (status === "confirming" || status === "sending") {
        // Update status but don't add coins yet
        result = await this._updatePaymentStatus(
          order,
          status,
          payload,
          transaction
        );
      } else {
        // Pending or unknown status - do nothing
        result = {
          success: true,
          message: "Payment status updated",
          action: "no_action",
        };
      }

      // Log successful webhook
      await PaymentRepository.logWebhook({
        purchase_id: order.purchase_id,
        payment_id: paymentId,
        order_id: orderId,
        webhook_type: "payment_status_changed",
        request_body: payload,
        signature_valid: true,
        status: "PROCESSED",
      });

      // Increment webhook count
      await PaymentRepository.incrementWebhookCount(order.purchase_id, transaction);

      await transaction.commit();

      return {
        success: true,
        message: result.message,
        action: result.action,
        data: result.data,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("[PaymentService] Webhook processing error:", error);

      return {
        success: false,
        message: "Webhook processing failed",
        error_code: "WEBHOOK_ERROR",
        details: error.message,
      };
    }
  }

  /**
   * Process confirmed payment (coins should be added)
   * @private
   */
  async _processConfirmedPayment(order, user, payload, transaction) {
    try {
      // Check if coins already added
      if (order.coins_added) {
        return {
          message: "Payment already confirmed",
          action: "already_processed",
        };
      }

      // Add coins to user
      const balanceUpdate = await PaymentRepository.addCoinsToUser(
        user.user_id,
        order.coins,
        transaction
      );

      // Update order as completed
      await PaymentRepository.updateOrderWithTransaction(order.purchase_id, {
        status: "FINISHED",
        coins_added: true,
        confirmation_count: payload.confirmation_count || 0,
      });

      console.log("[PaymentService] Coins added successfully:", {
        user_id: user.user_id,
        coins: order.coins,
        new_balance: balanceUpdate.new_balance,
      });

      return {
        message: "Payment confirmed and coins added",
        action: "coins_added",
        data: {
          user_id: user.user_id,
          coins_added: order.coins,
          new_balance: balanceUpdate.new_balance,
        },
      };
    } catch (error) {
      console.error("[PaymentService] Error processing confirmed payment:", error);
      throw error;
    }
  }

  /**
   * Process failed payment
   * @private
   */
  async _processFailedPayment(order, payload, transaction) {
    try {
      const errorMessage =
        payload.error_message || payload.payment_status || "Payment failed";

      await PaymentRepository.updateOrderWithTransaction(order.purchase_id, {
        status: "FAILED",
        error_message: errorMessage,
      });

      console.log("[PaymentService] Payment marked as failed:", {
        purchase_id: order.purchase_id,
        error: errorMessage,
      });

      return {
        message: "Payment marked as failed",
        action: "payment_failed",
        data: {
          purchase_id: order.purchase_id,
          error: errorMessage,
        },
      };
    } catch (error) {
      console.error("[PaymentService] Error processing failed payment:", error);
      throw error;
    }
  }

  /**
   * Update payment status (for confirming/sending states)
   * @private
   */
  async _updatePaymentStatus(order, status, payload, transaction) {
    try {
      await PaymentRepository.updateOrderWithTransaction(order.purchase_id, {
        status: status.toUpperCase() === "CONFIRMING" ? "CONFIRMING" : "SENDING",
        confirmation_count: payload.confirmation_count || 0,
      });

      console.log("[PaymentService] Payment status updated:", {
        purchase_id: order.purchase_id,
        status: status,
      });

      return {
        message: `Payment status updated to ${status}`,
        action: "status_updated",
      };
    } catch (error) {
      console.error("[PaymentService] Error updating payment status:", error);
      throw error;
    }
  }

  /**
   * Get payment status
   * @param {number} purchaseId - Purchase ID
   * @returns {object} - Payment details
   */
  async getPaymentStatus(purchaseId) {
    try {
      const order = await PaymentRepository.getOrderWithUser(purchaseId);

      if (!order) {
        return {
          success: false,
          message: "Payment not found",
          error_code: "PAYMENT_NOT_FOUND",
        };
      }

      return {
        success: true,
        data: {
          purchase_id: order.purchase_id,
          order_id: order.order_id,
          payment_id: order.payment_id,
          status: order.status,
          coins: order.coins,
          coins_added: order.coins_added,
          amount_usd: order.amount_usd,
          currency: order.currency,
          user_balance: order.User?.available_coins || 0,
          created_at: order.created_at,
          updated_at: order.updated_at,
          confirmation_count: order.confirmation_count,
        },
      };
    } catch (error) {
      console.error("[PaymentService] Error getting payment status:", error);
      return {
        success: false,
        message: "Error fetching payment status",
        error_code: "FETCH_ERROR",
      };
    }
  }

  /**
   * Get user's payment history
   * @param {number} userId - User ID
   * @param {number} limit - Number of records
   * @returns {object} - Payment history
   */
  async getUserPaymentHistory(userId, limit = 10) {
    try {
      const orders = await PaymentRepository.getUserPaymentOrders(userId, limit);

      return {
        success: true,
        data: orders.map((order) => ({
          purchase_id: order.purchase_id,
          order_id: order.order_id,
          status: order.status,
          coins: order.coins,
          coins_added: order.coins_added,
          amount_usd: order.amount_usd,
          currency: order.currency,
          created_at: order.created_at,
        })),
      };
    } catch (error) {
      console.error("[PaymentService] Error fetching payment history:", error);
      return {
        success: false,
        message: "Error fetching payment history",
        error_code: "FETCH_ERROR",
      };
    }
  }
}

module.exports = new PaymentService();
