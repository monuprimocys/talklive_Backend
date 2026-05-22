const db = require("../../../models");

/**
 * Payment Repository Layer
 * Handles database operations for payments with transactions
 */
class PaymentRepository {
  /**
   * Create a new coin purchase order
   * @param {object} orderData - Payment order data
   * @returns {object} - Created order record
   */
  static async createCoinPurchaseOrder(orderData, transaction = null) {
    return await db.CoinPurchaseOrder.create(orderData, { transaction });
  }

  /**
   * Find payment order by payment ID
   * @param {string} paymentId - NOWPayments payment ID
   * @returns {object} - Payment order or null
   */
  static async findByPaymentId(paymentId) {
    return await db.CoinPurchaseOrder.findOne({
      where: { payment_id: paymentId },
    });
  }

  /**
   * Find payment order by order ID
   * @param {string} orderId - NOWPayments order ID
   * @returns {object} - Payment order or null
   */
  static async findByOrderId(orderId) {
    return await db.CoinPurchaseOrder.findOne({
      where: { order_id: orderId },
    });
  }

  /**
   * Find payment order by purchase ID
   * @param {number} purchaseId - Purchase ID
   * @returns {object} - Payment order or null
   */
  static async findByPurchaseId(purchaseId) {
    return await db.CoinPurchaseOrder.findByPk(purchaseId);
  }

  /**
   * Update payment order status with transaction
   * @param {number} purchaseId - Purchase ID
   * @param {object} updateData - Data to update
   * @param {object} transaction - Sequelize transaction
   * @returns {object} - Updated record
   */
  static async updateOrderWithTransaction(
    purchaseId,
    updateData,
    transaction
  ) {
    const order = await db.CoinPurchaseOrder.findByPk(purchaseId, {
      transaction,
      lock: true,
    });

    if (!order) {
      throw new Error(`Payment order ${purchaseId} not found`);
    }

    return await order.update(updateData, { transaction });
  }

  /**
   * Increment webhook count with transaction
   * @param {number} purchaseId - Purchase ID
   * @param {object} transaction - Sequelize transaction
   * @returns {object} - Updated record
   */
  static async incrementWebhookCount(purchaseId, transaction) {
    const order = await db.CoinPurchaseOrder.findByPk(purchaseId, { transaction });
    if (order) {
      return await order.update(
        {
          webhook_count: (order.webhook_count || 0) + 1,
          last_webhook_at: new Date(),
        },
        { transaction }
      );
    }
  }

  /**
   * Add coins to user with transaction
   * @param {number} userId - User ID
   * @param {number} coins - Coins to add
   * @param {object} transaction - Sequelize transaction
   * @returns {object} - Updated user record
   */
  static async addCoinsToUser(userId, coins, transaction) {
    const user = await db.User.findByPk(userId, {
      transaction,
      lock: true,
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const currentCoins = Number(user.available_coins) || 0;
    await user.update(
      {
        available_coins: currentCoins + coins,
      },
      { transaction }
    );

    return {
      user_id: userId,
      previous_balance: currentCoins,
      new_balance: currentCoins + coins,
      coins_added: coins,
    };
  }

  /**
   * Get user by ID with lock
   * @param {number} userId - User ID
   * @param {object} transaction - Sequelize transaction
   * @returns {object} - User record
   */
  static async getUserWithLock(userId, transaction) {
    return await db.User.findByPk(userId, {
      transaction,
      lock: true,
    });
  }

  /**
   * Log webhook for audit trail
   * @param {object} logData - Webhook log data
   * @returns {object} - Created log record
   */
  static async logWebhook(logData) {
    return await db.PaymentWebhookLog.create(logData);
  }

  /**
   * Find duplicate webhook by payment ID
   * @param {string} paymentId - NOWPayments payment ID
   * @returns {object} - Webhook log or null
   */
  static async findDuplicateWebhook(paymentId) {
    return await db.PaymentWebhookLog.findOne({
      where: {
        payment_id: paymentId,
        status: ["PROCESSED", "DUPLICATE"],
      },
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Get payment order with user details
   * @param {number} purchaseId - Purchase ID
   * @returns {object} - Payment order with user
   */
  static async getOrderWithUser(purchaseId) {
    return await db.CoinPurchaseOrder.findByPk(purchaseId, {
      include: [
        {
          model: db.User,
          as: "User",
          attributes: ["user_id", "user_name", "email", "available_coins"],
        },
      ],
    });
  }

  /**
   * Get user's recent payment orders
   * @param {number} userId - User ID
   * @param {number} limit - Number of orders to fetch
   * @returns {array} - Payment orders
   */
  static async getUserPaymentOrders(userId, limit = 10) {
    return await db.CoinPurchaseOrder.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit,
    });
  }

  /**
   * Get webhook logs for a payment
   * @param {number} purchaseId - Purchase ID
   * @returns {array} - Webhook logs
   */
  static async getWebhookLogs(purchaseId) {
    return await db.PaymentWebhookLog.findAll({
      where: { purchase_id: purchaseId },
      order: [["created_at", "DESC"]],
    });
  }
}

module.exports = PaymentRepository;
