<!-- NOWPayments Integration - Implementation Examples -->

# 📚 NOWPayments Integration - Code Examples & Implementation Guide

Complete examples for integrating coin purchases with NOWPayments.

---

## 1️⃣ Frontend Integration (Client-Side)

### React/React Native Example

```javascript
// services/paymentService.js
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export const PaymentService = {
  /**
   * Create payment order
   * @param {number} coins - Number of coins to purchase
   * @param {string} currency - BTC, ETH, or USDT
   * @param {number} amount_usd - Amount in USD
   * @returns {object} - Payment details with payment_url
   */
  async createPayment(coins, currency, amount_usd, token) {
    try {
      const response = await axios.post(
        `${API_BASE}/payment/create`,
        { coins, currency, amount_usd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Payment creation failed:', error);
      throw error;
    }
  },

  /**
   * Get payment status
   * @param {number} purchase_id - Purchase order ID
   */
  async getPaymentStatus(purchase_id, token) {
    try {
      const response = await axios.get(
        `${API_BASE}/payment/status/${purchase_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  },

  /**
   * Get payment history
   * @param {number} limit - Number of records
   */
  async getPaymentHistory(limit = 10, token) {
    try {
      const response = await axios.get(
        `${API_BASE}/payment/history?limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('History fetch failed:', error);
      throw error;
    }
  },
};
```

### React Component Example

```javascript
// components/BuyCoinModal.jsx
import React, { useState } from 'react';
import { PaymentService } from '../services/paymentService';

export const BuyCoinModal = ({ token, onSuccess }) => {
  const [coins, setCoins] = useState(100);
  const [currency, setCurrency] = useState('BTC');
  const [amount, setAmount] = useState('25.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await PaymentService.createPayment(
        parseInt(coins),
        currency,
        parseFloat(amount),
        token
      );

      if (result.success) {
        // Open NOWPayments payment page
        window.open(result.data.payment_url, '_blank');
        
        // Store purchase_id for later status check
        localStorage.setItem('last_purchase_id', result.data.purchase_id);
        
        // Optionally poll for payment status
        pollPaymentStatus(result.data.purchase_id, token);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (purchase_id, token, maxAttempts = 120) => {
    // Poll for 10 minutes (120 * 5 second intervals)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      try {
        const status = await PaymentService.getPaymentStatus(purchase_id, token);
        
        if (status.data.coins_added) {
          console.log('✅ Payment confirmed! Coins added:', status.data.coins);
          onSuccess?.(status.data);
          break;
        } else if (status.data.status === 'FAILED') {
          console.error('❌ Payment failed');
          break;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }
  };

  return (
    <div className="buy-coin-modal">
      <h2>Buy Coins</h2>
      
      <div className="form-group">
        <label>Number of Coins</label>
        <input
          type="number"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
          min="1"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          disabled={loading}
        >
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          disabled={loading}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <button
        onClick={handleCreatePayment}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Creating Payment...' : 'Proceed to Payment'}
      </button>
    </div>
  );
};
```

---

## 2️⃣ Backend Integration Examples

### Express Middleware for Payment Status Check

```javascript
// middleware/paymentStatusMiddleware.js
const PaymentService = require('../service/payment/payment.service');

/**
 * Middleware to check if user has pending payments
 * Adds payment info to request if found
 */
async function checkPendingPayments(req, res, next) {
  try {
    const user_id = req.authData?.user_id;
    if (!user_id) return next();

    const db = require('../../models');
    const pendingPayment = await db.CoinPurchaseOrder.findOne({
      where: {
        user_id,
        status: ['PENDING', 'CONFIRMING', 'SENDING'],
      },
      order: [['created_at', 'DESC']],
    });

    if (pendingPayment) {
      req.pendingPayment = {
        purchase_id: pendingPayment.purchase_id,
        status: pendingPayment.status,
        coins: pendingPayment.coins,
        amount_usd: pendingPayment.amount_usd,
      };
    }

    next();
  } catch (error) {
    console.error('Payment status check error:', error);
    next();
  }
}

module.exports = checkPendingPayments;
```

### Combine with Call Controller (Example)

```javascript
// controller/call_controller/call.controller.js
const { deductCoins } = require('../../service/payment/coins.service');

async function endCall(req, res) {
  try {
    const { call_id, duration_seconds } = req.body;
    const from_user_id = req.authData.user_id;
    // ... existing code ...

    // Calculate coin deduction
    const coinsPerMinute = 10; // Example: 10 coins per minute
    const coinsToDeduct = Math.ceil((duration_seconds / 60) * coinsPerMinute);

    // Deduct coins
    const deductResult = await deductCoins(
      from_user_id,
      to_user_id,
      coinsToDeduct,
      'VIDEO_CALL',
      { call_duration_seconds: duration_seconds, session_id: call_id }
    );

    if (!deductResult.success) {
      return generalResponse(
        res,
        { success: false },
        deductResult.message,
        false,
        true
      );
    }

    return generalResponse(
      res,
      {
        success: true,
        data: {
          call_id,
          coins_deducted: deductResult.data.coins_deducted,
          remaining_balance: deductResult.data.sender_remaining_balance,
        },
      },
      'Call ended successfully',
      true,
      false
    );
  } catch (error) {
    console.error('End call error:', error);
    return generalResponse(res, { success: false }, 'Error ending call', false, true);
  }
}

module.exports = { endCall };
```

---

## 3️⃣ Database Queries & Maintenance

### Monitoring Queries

```javascript
// utils/paymentMonitoring.js

/**
 * Get payment analytics
 */
async function getPaymentAnalytics(db) {
  const stats = {};

  // Total payments
  stats.totalPayments = await db.CoinPurchaseOrder.count();

  // Completed payments
  stats.completedPayments = await db.CoinPurchaseOrder.count({
    where: { status: 'FINISHED' },
  });

  // Total coins sold
  const coinSum = await db.CoinPurchaseOrder.sum('coins', {
    where: { coins_added: true },
  });
  stats.totalCoinsSold = coinSum || 0;

  // Total revenue (USD)
  const revenueSum = await db.CoinPurchaseOrder.sum('amount_usd', {
    where: { coins_added: true },
  });
  stats.totalRevenueUSD = revenueSum || 0;

  // Failed payments
  stats.failedPayments = await db.CoinPurchaseOrder.count({
    where: { status: 'FAILED' },
  });

  // Pending payments
  stats.pendingPayments = await db.CoinPurchaseOrder.count({
    where: { status: ['PENDING', 'CONFIRMING', 'SENDING'] },
  });

  return stats;
}

/**
 * Get suspicious webhooks (potential attacks)
 */
async function getSuspiciousWebhooks(db) {
  return await db.PaymentWebhookLog.findAll({
    where: {
      [db.Sequelize.Op.or]: [
        { signature_valid: false },
        { status: 'INVALID' },
      ],
    },
    order: [['created_at', 'DESC']],
    limit: 100,
  });
}

/**
 * Get duplicate webhooks
 */
async function getDuplicateWebhooks(db) {
  return await db.PaymentWebhookLog.findAll({
    where: { status: 'DUPLICATE' },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
}

/**
 * Retry failed payments
 */
async function retryFailedPayments(db) {
  // Get payments older than 1 hour still in PENDING
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const stuckPayments = await db.CoinPurchaseOrder.findAll({
    where: {
      status: 'PENDING',
      created_at: { [db.Sequelize.Op.lt]: oneHourAgo },
    },
  });

  console.log(`Found ${stuckPayments.length} stuck payments`);
  return stuckPayments;
}

module.exports = {
  getPaymentAnalytics,
  getSuspiciousWebhooks,
  getDuplicateWebhooks,
  retryFailedPayments,
};
```

### Admin API Endpoint (Optional)

```javascript
// routes/admin.payment.routes.js
const { authMiddleware } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/adminMiddleware');

/**
 * GET /api/admin/payment/analytics
 * Returns payment statistics
 */
router.get('/analytics', authMiddleware, isAdmin, async (req, res) => {
  try {
    const db = require('../../../models');
    const analytics = await getPaymentAnalytics(db);
    
    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
    });
  }
});

/**
 * GET /api/admin/payment/suspicious-webhooks
 * Returns webhooks with invalid signatures
 */
router.get('/suspicious-webhooks', authMiddleware, isAdmin, async (req, res) => {
  try {
    const db = require('../../../models');
    const suspicious = await getSuspiciousWebhooks(db);
    
    return res.json({
      success: true,
      count: suspicious.length,
      data: suspicious,
    });
  } catch (error) {
    console.error('Suspicious webhooks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching suspicious webhooks',
    });
  }
});
```

---

## 4️⃣ Testing Script

```javascript
// tests/payment.test.js
const request = require('supertest');
const app = require('../../index'); // Your Express app
const db = require('../../models');

describe('Payment Integration', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create test user
    const user = await db.User.create({
      full_name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      user_name: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: 'hashed_password',
      login_type: 'email',
      available_coins: 1000,
    });

    userId = user.user_id;
    // Generate JWT token for user
    token = generateTestToken(user);
  });

  test('POST /api/payment/create - Valid payment creation', async () => {
    const response = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coins: 100,
        currency: 'BTC',
        amount_usd: 25.00,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.payment_url).toBeDefined();
    expect(response.body.data.purchase_id).toBeDefined();
  });

  test('POST /api/payment/create - Invalid amount', async () => {
    const response = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coins: 100,
        currency: 'BTC',
        amount_usd: 0.001, // Too small
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error_code).toBe('INVALID_AMOUNT');
  });

  test('POST /api/payment/create - Invalid currency', async () => {
    const response = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coins: 100,
        currency: 'INVALID',
        amount_usd: 25.00,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error_code).toBe('INVALID_CURRENCY');
  });

  test('GET /api/payment/status/:purchase_id - Valid request', async () => {
    // First create a payment
    const createRes = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coins: 100,
        currency: 'BTC',
        amount_usd: 25.00,
      });

    const purchase_id = createRes.body.data.purchase_id;

    // Then check status
    const response = await request(app)
      .get(`/api/payment/status/${purchase_id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.purchase_id).toBe(purchase_id);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.coins_added).toBe(false);
  });

  test('GET /api/payment/history - Get user payment history', async () => {
    const response = await request(app)
      .get('/api/payment/history?limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/payment/webhook - Valid signature', async () => {
    // Create payment first
    const createRes = await request(app)
      .post('/api/payment/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coins: 100,
        currency: 'BTC',
        amount_usd: 25.00,
      });

    const paymentId = createRes.body.data.payment_id;
    const orderId = createRes.body.data.order_id;

    // Create webhook payload
    const payload = {
      payment_id: paymentId,
      order_id: orderId,
      payment_status: 'finished',
      confirmation_count: 3,
    };

    // Generate valid signature
    const crypto = require('crypto');
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    const signature = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Send webhook
    const response = await request(app)
      .post('/api/payment/webhook')
      .set('X-NOWPAYMENTS-SIG', signature)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify coins were added
    const user = await db.User.findByPk(userId);
    expect(user.available_coins).toBe(1100); // Original 1000 + 100
  });

  test('POST /api/payment/webhook - Invalid signature', async () => {
    const payload = {
      payment_id: 'test123',
      payment_status: 'finished',
    };

    const response = await request(app)
      .post('/api/payment/webhook')
      .set('X-NOWPAYMENTS-SIG', 'invalid_signature')
      .send(payload);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  afterAll(async () => {
    // Cleanup
    await db.User.destroy({ where: { user_id: userId } });
    await db.sequelize.close();
  });
});
```

---

## 5️⃣ Production Deployment Checklist

```bash
# Pre-deployment

# 1. Update .env with real credentials
NOWPAYMENTS_API_KEY=your_real_key
NOWPAYMENTS_IPN_SECRET=your_real_secret

# 2. Run database migrations
npm run migrate

# 3. Test webhook locally
npm test payment.test.js

# 4. Configure production server
# - Enable HTTPS
# - Setup domain
# - Configure firewall
# - Add webhook URL to NOWPayments dashboard

# 5. Monitor in production
# - Check server logs
# - Monitor database
# - Setup alerts for failed payments
# - Track webhook delivery

# 6. Health check endpoint (optional)
GET /api/payment/health
```

---

## 6️⃣ Production Monitoring Script

```javascript
// scripts/monitorPayments.js
const cron = require('node-cron');
const db = require('../models');

/**
 * Run every 5 minutes
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[Monitor] Checking payment health...');

    // Check for stuck payments
    const stuckPayments = await db.CoinPurchaseOrder.findAll({
      where: {
        status: 'PENDING',
        created_at: {
          [db.Sequelize.Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (stuckPayments.length > 0) {
      console.warn(`⚠️  Found ${stuckPayments.length} stuck payments older than 24h`);
      // Send alert to admin
    }

    // Check for signature failures
    const invalidSignatures = await db.PaymentWebhookLog.count({
      where: {
        signature_valid: false,
        created_at: {
          [db.Sequelize.Op.gt]: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (invalidSignatures > 0) {
      console.warn(`⚠️  Found ${invalidSignatures} invalid signatures in last hour`);
      // Send security alert
    }

    // Check for errors
    const errors = await db.PaymentWebhookLog.count({
      where: {
        status: 'ERROR',
        created_at: {
          [db.Sequelize.Op.gt]: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (errors > 0) {
      console.warn(`⚠️  Found ${errors} webhook errors in last hour`);
    }

    console.log('[Monitor] Health check complete');
  } catch (error) {
    console.error('[Monitor] Health check failed:', error);
  }
});
```

---

## 📝 Quick Reference

### Payment Status Flow
```
PENDING → CONFIRMING → CONFIRMED → SENDING → FINISHED ✅
         ↓
        FAILED ❌
```

### Critical Fields
```javascript
{
  coins_added: false,      // Safety flag - prevents duplicate credit
  webhook_count: 0,        // Audit trail for duplicate detection
  signature_valid: true,   // Security validation
  status: 'FINISHED',      // Only when finished, add coins
}
```

### Error Recovery
```
Invalid Signature → Log & alert, don't process
Duplicate Webhook → Skip, return 200 OK
User Not Found → Log error, don't crash
Payment Pending → Do nothing, wait for next update
```
