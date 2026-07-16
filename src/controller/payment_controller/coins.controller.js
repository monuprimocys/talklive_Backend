const { generalResponse } = require("../../helper/response.helper");
const CoinsService = require("../../service/payment/coins.service");
const db = require("../../../models");

/**
 * Coin Balance and Transactions Controller
 * Handles balance queries and transaction history
 */

/**
 * Get user's coin balance
 * GET /api/coins/balance
 */
async function getBalance(req, res) {
  try {
    const user_id = req.authData.user_id;

    const balanceResult = await CoinsService.getBalance(user_id);

    if (!balanceResult.success) {
      return generalResponse(
        res,
        { success: false },
        balanceResult.message,
        false,
        true
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: balanceResult.data,
      },
      "Balance retrieved successfully",
      true,
      false
    );
  } catch (error) {
    console.error("Get balance error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching balance",
      false,
      true
    );
  }
}

/**
 * Get transaction history
 * GET /api/coins/transactions?limit=20&offset=0
 */
async function getTransactionHistory(req, res) {
  try {
    const user_id = req.authData.user_id;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const historyResult = await CoinsService.getTransactionHistory(
      user_id,
      limit,
      offset
    );

    if (!historyResult.success) {
      return generalResponse(
        res,
        { success: false },
        historyResult.message,
        false,
        true
      );
    }

    // Transform transactions for better readability
    const formattedTransactions = historyResult.data.map((transaction) => {
      const isOutgoing = transaction.from_user_id === user_id;

      return {
        transaction_id: transaction.transaction_id,
        type: transaction.transaction_type,
        coins: transaction.coins_deducted,
        status: transaction.status,
        direction: isOutgoing ? "debit" : "credit",
        other_user: isOutgoing
          ? {
              user_id: transaction.to_user_id,
              user_name: transaction.toUser?.user_name || "Unknown",
            }
          : {
              user_id: transaction.from_user_id,
              user_name: transaction.fromUser?.user_name || "Unknown",
            },
        duration_minutes:
          transaction.call_duration_seconds &&
          transaction.call_duration_seconds > 0
            ? Math.ceil(transaction.call_duration_seconds / 60)
            : null,
        description: transaction.description,
        created_at: transaction.created_at,
      };
    });

    return generalResponse(
      res,
      {
        success: true,
        data: formattedTransactions,
        pagination: historyResult.pagination,
      },
      "Transactions retrieved successfully",
      true,
      false
    );
  } catch (error) {
    console.error("Get transaction history error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching transaction history",
      false,
      true
    );
  }
}

/**
 * Get transaction details
 * GET /api/coins/transaction/:transaction_id
 */
async function getTransactionDetail(req, res) {
  try {
    const { transaction_id } = req.params;

    const transaction = await db.CoinTransaction.findByPk(transaction_id, {
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
    });

    if (!transaction) {
      return generalResponse(
        res,
        { success: false },
        "Transaction not found",
        false,
        true
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: transaction,
      },
      "Transaction retrieved successfully",
      true,
      false
    );
  } catch (error) {
    console.error("Get transaction detail error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching transaction details",
      false,
      true
    );
  }
}

/**
 * Get user statistics for earnings
 * GET /api/coins/stats
 */
async function getUserStats(req, res) {
  try {
    const user_id = req.authData.user_id;

    // Get current balance
    const balanceResult = await CoinsService.getBalance(user_id);

    if (!balanceResult.success) {
      return generalResponse(
        res,
        { success: false },
        balanceResult.message,
        false,
        true
      );
    }

    // Get transaction counts by type
    const stats = await db.sequelize.query(
      `SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(coins_deducted) as total_coins
      FROM CoinTransactions
      WHERE to_user_id = ? AND status = 'COMPLETED'
      GROUP BY transaction_type`,
      {
        replacements: [user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // Calculate average price for each type
    const avgStats = await db.sequelize.query(
      `SELECT 
        transaction_type,
        AVG(coins_deducted) as avg_price
      FROM CoinTransactions
      WHERE to_user_id = ? AND status = 'COMPLETED'
      GROUP BY transaction_type`,
      {
        replacements: [user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // Get total transactions received
    const totalTransactions = await db.CoinTransaction.count({
      where: {
        to_user_id: user_id,
        status: "COMPLETED",
      },
    });

    return generalResponse(
      res,
      {
        success: true,
        data: {
          available_coins: balanceResult.data.available_coins,
          total_earned: balanceResult.data.total_earned,
          total_transactions: totalTransactions,
          earnings_by_type: stats,
          average_by_type: avgStats,
        },
      },
      "Statistics retrieved successfully",
      true,
      false
    );
  } catch (error) {
    console.error("Get user stats error:", error);
    return generalResponse(
      res,
      { success: false },
      "Error fetching statistics",
      false,
      true
    );
  }
}

module.exports = {
  getBalance,
  getTransactionHistory,
  getTransactionDetail,
  getUserStats,
};
