const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const transaction_controller = require('../controller/Transaction_controller/transaction.controller');
const transaction_controller_admin = require('../controller/Admin_controller/Transaction_controller/transaction.controller');

const router = express.Router();


router.use(authMiddleware)

router.post('/recharge', transaction_controller.Money_to_coin);
router.post('/send-gift', transaction_controller.Coin_to_Coin);
router.post('/withdraw', transaction_controller.Coin_to_Money);
router.post('/history', transaction_controller.Transaction_history);
router.post('/create-stripe-paymentintent', transaction_controller.createPlanIntent);
router.post('/transaction_conf', transaction_controller.transaction_conf_data);
router.post('/get-transaction-plan', transaction_controller_admin.get_transaction_plan);
router.post('/battle-gift-history', transaction_controller.Transaction_history_BattelWinnor);



module.exports = router;
