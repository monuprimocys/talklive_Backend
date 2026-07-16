const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
// Coins controller
const {
  getBalance,
  getTransactionHistory,
  getTransactionDetail,
  getUserStats,
} = require("../controller/payment_controller/coins.controller");




// ==================== COIN BALANCE & TRANSACTION ROUTES ====================

/**
 * Get user's coin balance
 * GET /api/paid-communication/balance
 */
router.get(
  "/balance",
  authMiddleware,
  getBalance
);

/**
 * Get transaction history
 * GET /api/paid-communication/transactions?limit=20&offset=0
 */
router.get(
  "/transactions",
  authMiddleware,
  getTransactionHistory
);

/**
 * Get specific transaction details
 * GET /api/paid-communication/transaction/:transaction_id
 */
router.get(
  "/transaction/:transaction_id",
  authMiddleware,
  getTransactionDetail
);

/**
 * Get user's earnings statistics
 * GET /api/paid-communication/stats
 */
router.get(
  "/stats",
  authMiddleware,
  getUserStats
);

module.exports = router;