const db = require("../../../models");
const { v4: uuidv4 } = require("uuid");

/**
 * Coins Management Service
 * Handles coin deductions, additions, and transaction logging
 */

class CoinsService {
  /**
   * Deduct coins from sender and add to recipient
   * @param {number} from_user_id - Sender user ID
   * @param {number} to_user_id - Recipient user ID
   * @param {number} coins - Number of coins to transfer
   * @param {string} transaction_type - MESSAGE, VOICE_CALL, or VIDEO_CALL
   * @param {object} extra_data - Additional data {call_duration_seconds, session_id, etc}
   * @returns {object} - Transaction result
   */
  static async deductCoins(
    from_user_id,
    to_user_id,
    coins,
    transaction_type,
    extra_data = {}
  ) {
    const transaction = await db.sequelize.transaction();

    try {
      // Get sender
      const sender = await db.User.findByPk(from_user_id, {
        transaction,
        lock: true,
      });

      if (!sender) {
        await transaction.rollback();
        return {
          success: false,
          message: "Sender not found",
          error_code: "SENDER_NOT_FOUND",
        };
      }

      // Check balance
      const current_balance = sender.available_coins || 0;
      if (current_balance < coins) {
        await transaction.rollback();
        return {
          success: false,
          message: `Insufficient coins. Required: ${coins}, Available: ${current_balance}`,
          error_code: "INSUFFICIENT_COINS",
        };
      }

      // Get recipient
      const recipient = await db.User.findByPk(to_user_id, {
        transaction,
        lock: true,
      });

      if (!recipient) {
        await transaction.rollback();
        return {
          success: false,
          message: "Recipient not found",
          error_code: "RECIPIENT_NOT_FOUND",
        };
      }

      // Deduct from sender
      await sender.update(
        {
          available_coins: current_balance - coins,
        },
        { transaction }
      );

      // Platform commission (optional)
      const commissionPercent = parseFloat(process.env.COMMISSION_PERCENT) || 0;
      const commission = commissionPercent > 0 ? Math.floor((coins * commissionPercent) / 100) : 0;
      const netToRecipient = Math.max(0, coins - commission);

      // Add net amount to recipient (platform keeps commission off-chain)
      const recipient_current_balance = recipient.available_coins || 0;
      await recipient.update(
        {
          available_coins: recipient_current_balance + netToRecipient,
        },
        { transaction }
      );

      // Create transaction record
      const transaction_record = await db.CoinTransaction.create(
        {
          from_user_id,
          to_user_id,
          transaction_type,
          // coins_deducted represents amount credited to recipient (net)
          coins_deducted: netToRecipient,
          status: "COMPLETED",
          call_duration_seconds: extra_data.call_duration_seconds || null,
          session_id: extra_data.session_id || null,
          description:
            (extra_data.description || "") +
            (commission > 0
              ? ` | commission:${commission}(${commissionPercent}%) | gross:${coins}`
              : ""),
          completed_at: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Coins deducted successfully",
        data: {
          transaction_id: transaction_record.transaction_id,
          coins_deducted: netToRecipient,
          commission_collected: commission,
          sender_remaining_balance: current_balance - coins,
          recipient_new_balance: recipient_current_balance + netToRecipient,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Coin deduction error:", error);
      return {
        success: false,
        message: "Error processing coin deduction",
        error_code: "DEDUCTION_ERROR",
      };
    }
  }

  /**
   * Lock coins for ongoing call
   * @param {number} user_id - User ID
   * @param {number} coins_to_lock - Coins to lock
   * @returns {object} - Lock result with session_id
   */
  static async lockCoinsForCall(user_id, coins_to_lock) {
    const transaction = await db.sequelize.transaction();

    try {
      const user = await db.User.findByPk(user_id, {
        transaction,
        lock: true,
      });

      if (!user) {
        await transaction.rollback();
        return {
          success: false,
          message: "User not found",
          error_code: "USER_NOT_FOUND",
        };
      }

      const current_balance = user.available_coins || 0;

      if (current_balance < coins_to_lock) {
        await transaction.rollback();
        return {
          success: false,
          message: `Insufficient coins to lock. Required: ${coins_to_lock}, Available: ${current_balance}`,
          error_code: "INSUFFICIENT_COINS",
        };
      }

      // Deduct from available and move to locked
      await user.update(
        {
          available_coins: current_balance - coins_to_lock,
        },
        { transaction }
      );

      const session_id = `call_${uuidv4()}`;

      await transaction.commit();

      return {
        success: true,
        message: "Coins locked successfully",
        session_id,
        locked_amount: coins_to_lock,
        remaining_balance: current_balance - coins_to_lock,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Coin locking error:", error);
      return {
        success: false,
        message: "Error locking coins",
        error_code: "LOCK_ERROR",
      };
    }
  }

  /**
   * Release locked coins (call cancelled or ended prematurely)
   * @param {number} user_id - User ID
   * @param {number} coins_to_release - Coins to release
   * @returns {object} - Release result
   */
  static async releaseLockedCoins(user_id, coins_to_release) {
    const transaction = await db.sequelize.transaction();

    try {
      const user = await db.User.findByPk(user_id, {
        transaction,
        lock: true,
      });

      if (!user) {
        await transaction.rollback();
        return {
          success: false,
          message: "User not found",
          error_code: "USER_NOT_FOUND",
        };
      }

      const current_balance = user.available_coins || 0;

      // Release locked coins back to available
      await user.update(
        {
          available_coins: current_balance + coins_to_release,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Coins released successfully",
        released_amount: coins_to_release,
        new_balance: current_balance + coins_to_release,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Coin release error:", error);
      return {
        success: false,
        message: "Error releasing coins",
        error_code: "RELEASE_ERROR",
      };
    }
  }

  /**
   * Refund coins and update transaction status
   * @param {number} transaction_id - Transaction record ID
   * @param {string} reason - Reason for refund
   * @returns {object} - Refund result
   */
  static async refundCoins(transaction_id, reason = "Refund requested") {
    const transaction = await db.sequelize.transaction();

    try {
      const coin_transaction = await db.CoinTransaction.findByPk(
        transaction_id,
        { transaction, lock: true }
      );

      if (!coin_transaction) {
        await transaction.rollback();
        return {
          success: false,
          message: "Transaction not found",
          error_code: "TRANSACTION_NOT_FOUND",
        };
      }

      if (coin_transaction.status === "REFUNDED") {
        await transaction.rollback();
        return {
          success: false,
          message: "Transaction already refunded",
          error_code: "ALREADY_REFUNDED",
        };
      }

      // Refund coins to sender
      const sender = await db.User.findByPk(coin_transaction.from_user_id, {
        transaction,
        lock: true,
      });

      const sender_current = sender.available_coins || 0;
      await sender.update(
        {
          available_coins: sender_current + coin_transaction.coins_deducted,
        },
        { transaction }
      );

      // Deduct from recipient
      const recipient = await db.User.findByPk(coin_transaction.to_user_id, {
        transaction,
        lock: true,
      });

      const recipient_current = recipient.available_coins || 0;
      const recipient_new_balance = Math.max(
        0,
        recipient_current - coin_transaction.coins_deducted
      );

      await recipient.update(
        {
          available_coins: recipient_new_balance,
        },
        { transaction }
      );

      // Update transaction status
      await coin_transaction.update(
        {
          status: "REFUNDED",
          description: `${coin_transaction.description || ""} - Refunded: ${reason}`,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Refund processed successfully",
        sender_refunded_coins: coin_transaction.coins_deducted,
        sender_new_balance: sender_current + coin_transaction.coins_deducted,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Refund error:", error);
      return {
        success: false,
        message: "Error processing refund",
        error_code: "REFUND_ERROR",
      };
    }
  }

  /**
   * Get user's transaction history
   * @param {number} user_id - User ID
   * @param {number} limit - Number of records to fetch
   * @param {number} offset - Offset for pagination
   * @returns {object} - Transactions list
   */
  static async getTransactionHistory(user_id, limit = 20, offset = 0) {
    try {
      const { count, rows } = await db.CoinTransaction.findAndCountAll({
        where: {
          [db.Sequelize.Op.or]: [
            { from_user_id: user_id },
            { to_user_id: user_id },
          ],
        },
        include: [
          {
            model: db.User,
            as: "fromUser",
            attributes: ["user_id", "user_name", "profile_pic"],
          },
          {
            model: db.User,
            as: "toUser",
            attributes: ["user_id", "user_name", "profile_pic"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        success: true,
        data: rows,
        pagination: {
          total: count,
          limit,
          offset,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Transaction history error:", error);
      return {
        success: false,
        message: "Error fetching transaction history",
        error_code: "HISTORY_ERROR",
      };
    }
  }

  /**
   * Get user's coin balance
   * @param {number} user_id - User ID
   * @returns {object} - Balance details
   */
  static async getBalance(user_id) {
  try {
    const user = await db.User.findByPk(user_id, {
      attributes: ["user_id", "available_coins"],
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
        error_code: "USER_NOT_FOUND",
      };
    }

    // ✅ Sequelize ORM way (no raw SQL)
    const total_earned = await db.CoinTransaction.sum("coins_deducted", {
      where: {
        to_user_id: user_id,
        status: "COMPLETED",
      },
    });

    return {
      success: true,
      data: {
        user_id,
        available_coins: user.available_coins || 0,
        total_earned: total_earned || 0,
      },
    };
  } catch (error) {
    console.error("Balance fetch error:", error);
    return {
      success: false,
      message: "Error fetching balance",
      error_code: "BALANCE_ERROR",
    };
  }
}
}

module.exports = CoinsService;
