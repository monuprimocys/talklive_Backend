<!-- NOWPayments Integration Setup Guide -->

# 🚀 NOWPayments Coin Purchase Integration

Production-ready cryptocurrency payment system for coin purchases with comprehensive webhook handling, duplicate prevention, and security features.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup & Configuration](#setup--configuration)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Database Schema](#database-schema)
- [Webhook Handling](#webhook-handling)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Architecture Overview

### Clean Architecture Implementation

```
Controller Layer → Service Layer → Repository Layer → Database
    ↓                 ↓                    ↓
payment.controller → payment.service → Payment.repository → Models
```

### Files Created

```
models/
  ├── CoinPurchaseOrder.js          # Stores payment orders
  └── PaymentWebhookLog.js          # Audit trail for webhooks

src/
  ├── controller/
  │   └── payment_controller/
  │       └── payment.controller.js # API endpoints
  ├── service/
  │   ├── payment/
  │   │   └── payment.service.js    # Business logic
  │   └── repository/
  │       └── Payment.repository.js # Database access
  └── routes/
      └── payment.routes.js         # Route definitions
```

---

## Setup & Configuration

### 1. Get NOWPayments Credentials

1. Visit [NOWPayments.io](https://nowpayments.io/)
2. Create an account and login
3. Go to **Settings → API Keys**
4. Copy your API Key and IPN Secret

### 2. Update Environment Variables

Update your `.env` file:

```env
########################################
# 💰 NOWPAYMENTS - Crypto Payment Gateway
########################################
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
```

### 3. Configure NOWPayments Webhook

1. Go to **Settings → Webhooks** in NOWPayments dashboard
2. Add webhook URL: `https://your-domain.com/api/payment/webhook`
3. Ensure your backend is accessible (not localhost for production)

### 4. Database Sync

Run migrations to create the new tables:

```bash
# If using Sequelize sync
npm run db:sync

# Or with migration tool:
npx sequelize-cli db:migrate
```

---

## API Endpoints

### 1. Create Payment

**Request:**
```
POST /api/payment/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "coins": 100,
  "currency": "BTC",
  "amount_usd": 2500
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "order_id": "ORD-123-1705123456-abc123",
    "payment_id": "5f4a1e8c9b2d3e5a",
    "payment_url": "https://nowpayments.io/payment/...",
    "pay_currency": "btc",
    "pay_amount": "0.0625",
    "status": "PENDING"
  },
  "message": "Payment created successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error_code": "INVALID_AMOUNT",
  "message": "Amount must be at least $0.01"
}
```

### 2. Get Payment Status

**Request:**
```
GET /api/payment/status/:purchase_id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "order_id": "ORD-123-1705123456-abc123",
    "payment_id": "5f4a1e8c9b2d3e5a",
    "status": "FINISHED",
    "coins": 100,
    "coins_added": true,
    "amount_usd": 2500,
    "currency": "BTC",
    "user_balance": 5250,
    "confirmation_count": 3,
    "created_at": "2024-01-13T10:30:00Z"
  }
}
```

### 3. Get Payment History

**Request:**
```
GET /api/payment/history?limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "purchase_id": 1,
      "order_id": "ORD-123-...",
      "status": "FINISHED",
      "coins": 100,
      "coins_added": true,
      "amount_usd": 2500,
      "currency": "BTC",
      "created_at": "2024-01-13T10:30:00Z"
    }
  ]
}
```

### 4. Webhook (NOWPayments → Your Server)

This is automatic - no manual request needed.

**Request (from NOWPayments):**
```
POST /api/payment/webhook
X-NOWPAYMENTS-SIG: signature_hash
Content-Type: application/json

{
  "payment_id": "5f4a1e8c9b2d3e5a",
  "order_id": "ORD-123-...",
  "order_description": "Purchase 100 coins",
  "price_amount": 2500,
  "price_currency": "usd",
  "pay_currency": "btc",
  "pay_amount": "0.0625",
  "payment_status": "finished",
  "pay_address": "1A1z7agoat3...",
  "actually_paid": "0.06251234",
  "actually_paid_at_fiat": 2500.50,
  "purchase_id": null,
  "invoice_id": null,
  "created_at": "2024-01-13T10:30:00Z",
  "updated_at": "2024-01-13T10:31:00Z",
  "outcome": null,
  "type": "payment",
  "confirmation_count": 3
}
```

---

## Security Features

### 1. Webhook Signature Validation

Uses HMAC-SHA512 for integrity:

```javascript
// Validates X-NOWPAYMENTS-SIG header
const isValid = PaymentService.validateWebhookSignature(payload, signature);
```

**Security:** Prevents unauthorized webhook calls

### 2. Duplicate Webhook Prevention

Maintains webhook audit trail:

```
Database: PaymentWebhookLog
- Tracks all webhooks by payment_id
- Detects duplicates before processing
- Prevents double coin credit
```

### 3. Database Transactions

All coin additions use ACID transactions:

```javascript
// Atomic operation: update order + add coins + log
transaction.commit(); // All or nothing
```

**Security:** Prevents inconsistent state

### 4. User Verification

Every endpoint verifies:
- User authentication
- User ownership of payment order
- Payment order existence

### 5. Status-Based Processing

Coins added only when `payment_status === "finished"`

```
PENDING → no action
CONFIRMING → status update only
SENDING → status update only
FINISHED → add coins (only once)
FAILED → mark as failed, don't add coins
```

---

## Database Schema

### CoinPurchaseOrder Table

```sql
CREATE TABLE "CoinPurchaseOrders" (
  purchase_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "Users"(user_id),
  order_id VARCHAR UNIQUE NOT NULL,
  payment_id VARCHAR UNIQUE,
  coins INTEGER NOT NULL,
  amount_usd DECIMAL(10, 2),
  currency ENUM ('BTC', 'ETH', 'USDT', 'USD'),
  pay_currency VARCHAR,
  pay_amount DECIMAL(18, 8),
  status ENUM ('PENDING', 'CONFIRMING', 'CONFIRMED', 'SENDING', 'FINISHED', 'FAILED', 'CANCELLED'),
  confirmation_count INTEGER DEFAULT 0,
  payment_address VARCHAR,
  ipn_callback_url VARCHAR,
  success_url VARCHAR,
  cancel_url VARCHAR,
  coins_added BOOLEAN DEFAULT FALSE,
  webhook_count INTEGER DEFAULT 0,
  last_webhook_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### PaymentWebhookLog Table

```sql
CREATE TABLE "PaymentWebhookLogs" (
  webhook_id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES "CoinPurchaseOrders"(purchase_id),
  payment_id VARCHAR INDEX,
  order_id VARCHAR INDEX,
  webhook_type VARCHAR,
  request_headers JSON,
  request_body JSON NOT NULL,
  signature_valid BOOLEAN DEFAULT FALSE,
  signature_received VARCHAR,
  status ENUM ('PROCESSED', 'DUPLICATE', 'INVALID', 'ERROR'),
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Webhook Handling

### Flow Diagram

```
NOWPayments Webhook
    ↓
[Signature Validation] ← X-NOWPAYMENTS-SIG header
    ↓
[Duplicate Check] ← Payment ID lookup
    ↓
[Status Check] ← payment_status field
    ↓
If FINISHED:
  ├─ Check coins_added flag
  ├─ Add coins to user (transaction)
  ├─ Mark coins_added = true
  └─ Log to PaymentWebhookLog
    ↓
If FAILED/CANCELLED:
  ├─ Mark order as FAILED
  ├─ Store error message
  └─ Log to PaymentWebhookLog
    ↓
If PENDING/CONFIRMING/SENDING:
  ├─ Update status only
  └─ Wait for next webhook
    ↓
Return 200 OK
```

### Payment Status Transitions

```
PENDING
  ↓
CONFIRMING (0-N confirmations)
  ↓
CONFIRMED (N+ confirmations)
  ↓
SENDING (broadcasting to blockchain)
  ↓
FINISHED (coins added to user) ✅
  ↓
(End)

OR at any stage:
  ↓
FAILED (coins NOT added) ❌
  ↓
(End)
```

---

## Error Handling

### Error Codes

| Error Code | Status | Action | Recoverable |
|-----------|--------|--------|------------|
| `INVALID_SIGNATURE` | 401 | Reject webhook | No |
| `USER_NOT_FOUND` | 404 | Log & alert | No |
| `ORDER_NOT_FOUND` | 404 | Log & alert | No |
| `INVALID_AMOUNT` | 400 | Reject request | Yes |
| `INVALID_CURRENCY` | 400 | Reject request | Yes |
| `NOWPAYMENTS_ERROR` | 502 | Retry later | Yes |
| `WEBHOOK_ERROR` | 500 | Return 200, retry | Yes |

### Logging

All critical events logged with context:

```javascript
console.log("[PaymentService] Coins added successfully:", {
  user_id: 123,
  coins: 100,
  new_balance: 5250,
});
```

---

## Testing

### Manual API Testing

#### Test 1: Create Payment

```bash
curl -X POST http://localhost:3000/api/payment/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coins": 100,
    "currency": "BTC",
    "amount_usd": 25.00
  }'
```

#### Test 2: Check Status

```bash
curl http://localhost:3000/api/payment/status/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 3: Get History

```bash
curl http://localhost:3000/api/payment/history?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 4: Simulate Webhook (Local Testing)

```bash
# Generate signature (replace with actual secret)
SECRET="your_ipn_secret_here"
PAYLOAD='{"payment_id":"test123","payment_status":"finished"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "X-NOWPAYMENTS-SIG: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

### Postman Collection

```json
{
  "info": {"name": "NOWPayments Integration"},
  "item": [
    {
      "name": "Create Payment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/payment/create",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"coins\": 100, \"currency\": \"BTC\", \"amount_usd\": 25}"
        }
      }
    }
  ]
}
```

### Test Cases

**✅ Happy Path:**
- Create payment → Receive payment URL → Payment confirmed via webhook → Coins added

**🔄 Duplicate Webhook:**
- Send same webhook twice → Coins added only once

**❌ Failed Payment:**
- Create payment → Payment failed via webhook → Coins NOT added

**⚠️ Pending Payment:**
- Create payment → Multiple confirming webhooks → Coins added on final "finished" webhook

---

## Environment Variables Reference

```env
# Required
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here

# Optional (defaults provided)
NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
baseUrl=http://192.168.0.14:3000

# Database (existing)
DB_HOST=127.0.0.1
DB_USERNAME=postgres
DB_PASSWORD=ReelBoost@1234
DB_DATABASE=talklivedb_localtesting
```

---

## Production Checklist

- [ ] Configure NOWPayments credentials in `.env`
- [ ] Add webhook URL to NOWPayments dashboard
- [ ] Ensure backend is publicly accessible
- [ ] Set up HTTPS (required for webhook)
- [ ] Test webhook signature validation
- [ ] Enable database logging/monitoring
- [ ] Set up error alerts
- [ ] Test with live cryptocurrency (small amount)
- [ ] Monitor webhook delivery
- [ ] Set up database backups
- [ ] Review audit logs regularly

---

## Troubleshooting

### Webhook Not Received

1. ✅ Check NOWPayments webhook settings
2. ✅ Verify your domain is publicly accessible
3. ✅ Enable HTTPS
4. ✅ Check server logs
5. ✅ Verify firewall rules

### Coins Not Added

1. ✅ Check `coins_added` flag in database
2. ✅ Check `payment_status` is "finished"
3. ✅ Review PaymentWebhookLog for errors
4. ✅ Verify user exists in database

### Webhook Signature Invalid

1. ✅ Verify IPN_SECRET matches NOWPayments
2. ✅ Check raw request body (not parsed)
3. ✅ Review signature validation logic

---

## Support & Resources

- [NOWPayments Documentation](https://nowpayments.io/documentation)
- [API Reference](https://nowpayments.io/documentation)
- [Webhook Examples](https://nowpayments.io/blog/crypto-payments-webhook/)
- [Status Page](https://status.nowpayments.io/)
