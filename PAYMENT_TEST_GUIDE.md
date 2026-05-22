# 💳 Payment Testing Guide for Plan Purchase

This guide will help you test the NOWPayments cryptocurrency payment system locally.

## 📋 Prerequisites

✅ NOWPayments API Key: `68bf677c-2d43-4ebb-811a-7dee6f95f8dd`  
✅ NOWPayments IPN Secret: `XVXWRGC-M7VMHPA-MTKZPF6-G2STJJF`  
✅ Backend running on: `http://192.168.0.14:3000`  
✅ Database configured with `CoinPurchaseOrder` and `PaymentWebhookLog` tables

---

## 🚀 Test Scenario 1: Create Payment Order

### Step 1: Get Your Auth Token

First, login to get a Bearer token:

```bash
curl -X POST http://192.168.0.14:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": 1,
    ...
  }
}
```

Save this token for the next steps.

### Step 2: Create Payment Order

```bash
curl -X POST http://192.168.0.14:3000/api/payment/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "coins": 100,
    "currency": "BTC",
    "amount_usd": 25.00
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "order_id": "ORD-1-1705123456-abc123xyz",
    "payment_id": "5f4a1e8c9b2d3e5a7f8c9d0e",
    "payment_url": "https://nowpayments.io/payment/...",
    "pay_currency": "btc",
    "pay_amount": "0.000625",
    "status": "PENDING"
  },
  "message": "Payment created successfully"
}
```

### Step 3: Complete Payment

1. Open the `payment_url` in a browser
2. Follow NOWPayments checkout flow
3. Make a test cryptocurrency payment (or use NOWPayments test mode)

---

## 🔄 Test Scenario 2: Check Payment Status

```bash
curl -X GET http://192.168.0.14:3000/api/payment/status/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response Progression:**

**Initially (PENDING):**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "status": "PENDING",
    "coins": 100,
    "coins_added": false
  }
}
```

**After Confirmation (CONFIRMING):**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "status": "CONFIRMING",
    "confirmation_count": 1,
    "coins": 100,
    "coins_added": false
  }
}
```

**After Blockchain Confirmation (FINISHED):**
```json
{
  "success": true,
  "data": {
    "purchase_id": 1,
    "status": "FINISHED",
    "confirmation_count": 3,
    "coins": 100,
    "coins_added": true,
    "user_balance": 5250
  }
}
```

---

## 📊 Test Scenario 3: Get Payment History

```bash
curl -X GET "http://192.168.0.14:3000/api/payment/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "purchase_id": 1,
      "order_id": "ORD-1-1705123456-abc123xyz",
      "status": "FINISHED",
      "coins": 100,
      "coins_added": true,
      "amount_usd": 25.00,
      "currency": "BTC",
      "created_at": "2024-01-13T10:30:00Z"
    }
  ]
}
```

---

## 🧪 Test Scenario 4: Simulate Webhook (Local Testing)

Use this to test webhook handling without making real payments.

### Generate Valid Signature

```bash
#!/bin/bash

# Your actual IPN Secret from .env
SECRET="XVXWRGC-M7VMHPA-MTKZPF6-G2STJJF"

# Webhook payload
PAYLOAD='{"payment_id":"test_payment_12345","order_id":"ORD-1-1705123456-abc123xyz","order_description":"Purchase 100 coins","price_amount":25,"price_currency":"usd","pay_currency":"btc","pay_amount":"0.000625","payment_status":"finished","pay_address":"1A1z7agoat3wyYQDhcSqnDP5D6Co787D29","actually_paid":"0.00062512","actually_paid_at_fiat":25.05,"purchase_id":null,"invoice_id":null,"created_at":"2024-01-13T10:30:00Z","updated_at":"2024-01-13T10:31:00Z","outcome":null,"type":"payment","confirmation_count":3}'

# Generate HMAC-SHA512 signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$SECRET" -hex | cut -d' ' -f2)

echo "Signature: $SIGNATURE"
echo ""
echo "Now send this webhook:"
echo ""
echo "curl -X POST http://192.168.0.14:3000/api/payment/webhook \\"
echo "  -H \"X-NOWPAYMENTS-SIG: $SIGNATURE\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '$PAYLOAD'"
```

### Send Webhook

```bash
curl -X POST http://192.168.0.14:3000/api/payment/webhook \
  -H "X-NOWPAYMENTS-SIG: YOUR_SIGNATURE_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id":"test_payment_12345",
    "order_id":"ORD-1-1705123456-abc123xyz",
    "payment_status":"finished",
    "pay_currency":"btc",
    "pay_amount":"0.000625",
    "confirmation_count":3
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "is_duplicate": false
}
```

---

## ✅ Test Cases Checklist

### Happy Path ✓
- [ ] Create payment → Get payment_url
- [ ] Complete payment on NOWPayments
- [ ] Receive webhook from NOWPayments
- [ ] Coins added to user account
- [ ] Check status shows "FINISHED" and `coins_added: true`

### Duplicate Webhook Prevention ✓
- [ ] Send same webhook twice
- [ ] First: `"success": true`
- [ ] Second: `"success": true, "is_duplicate": true`
- [ ] Coins added ONLY once

### Failed Payment ✓
- [ ] Create payment
- [ ] Cancel payment on NOWPayments
- [ ] Receive failed webhook
- [ ] Status shows "FAILED"
- [ ] Coins NOT added
- [ ] `coins_added: false`

### Status Progression ✓
- [ ] `PENDING` → payment created
- [ ] `CONFIRMING` → receiving blockchain confirmations
- [ ] `SENDING` → broadcasting to blockchain
- [ ] `FINISHED` → coins added
- [ ] `FAILED` → payment failed, coins not added

---

## 🐛 Debugging

### Check Database

```sql
-- View all payment orders
SELECT * FROM "CoinPurchaseOrders" ORDER BY created_at DESC LIMIT 10;

-- View specific order
SELECT * FROM "CoinPurchaseOrders" WHERE purchase_id = 1;

-- View webhook logs
SELECT * FROM "PaymentWebhookLogs" ORDER BY created_at DESC LIMIT 10;

-- Check for duplicates
SELECT payment_id, COUNT(*) as count FROM "PaymentWebhookLogs" GROUP BY payment_id HAVING COUNT(*) > 1;
```

### Check Server Logs

```bash
# Watch logs in real-time
tail -f your_log_file.log | grep -i "payment"

# Look for specific patterns
grep "PaymentService\|PaymentController" your_log_file.log
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Missing webhook signature" | Webhook header missing | Verify `X-NOWPAYMENTS-SIG` header is included |
| "INVALID_SIGNATURE" | Wrong IPN secret | Check `.env` NOWPAYMENTS_IPN_SECRET |
| "User not found" | Invalid token or user_id | Verify auth token and user exists |
| "Webhook not received" | Backend not public | Ensure backend is accessible from internet |
| Coins not added | Payment status not "finished" | Wait for payment confirmation |
| Duplicate coins | Webhook processed twice | Check PaymentWebhookLog for duplicates |

---

## 📱 Using Postman Collection

### Import Collection

1. Open Postman
2. Click "Import"
3. Create from this template:

```json
{
  "info": {
    "name": "NOWPayments Plan Purchase",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"coins\": 100,\n  \"currency\": \"BTC\",\n  \"amount_usd\": 25.00\n}"
        },
        "url": {
          "raw": "http://192.168.0.14:3000/api/payment/create",
          "protocol": "http",
          "host": ["192", "168", "0", "14"],
          "port": "3000",
          "path": ["api", "payment", "create"]
        }
      }
    },
    {
      "name": "2. Check Payment Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://192.168.0.14:3000/api/payment/status/1",
          "protocol": "http",
          "host": ["192", "168", "0", "14"],
          "port": "3000",
          "path": ["api", "payment", "status", "1"]
        }
      }
    },
    {
      "name": "3. Get Payment History",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://192.168.0.14:3000/api/payment/history?limit=10",
          "protocol": "http",
          "host": ["192", "168", "0", "14"],
          "port": "3000",
          "path": ["api", "payment", "history"],
          "query": [
            {
              "key": "limit",
              "value": "10"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "token",
      "value": "your_bearer_token_here"
    }
  ]
}
```

### Use Environment Variables

1. Create Environment: `Payment Testing`
2. Add variables:
   - `baseUrl`: `http://192.168.0.14:3000`
   - `token`: Your Bearer token
   - `purchase_id`: First created purchase ID

---

## 🎯 Next Steps

After successful payment testing:

1. **Verify Database:** Coins should appear in `CoinBalance` table
2. **Test Transaction Plans:** Link payments to subscription plans
3. **Frontend Integration:** Connect payment UI to these endpoints
4. **Production Deployment:** Update webhook URL to production domain
5. **Monitoring:** Set up alerts for failed payments

---

## 📞 Support

For issues:
1. Check [NOWPAYMENTS_SETUP.md](NOWPAYMENTS_SETUP.md)
2. Review server logs
3. Verify `.env` configuration
4. Check webhook signature validation
