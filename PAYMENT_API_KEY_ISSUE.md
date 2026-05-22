# 🔍 Payment API Testing - Troubleshooting Guide

Your test shows: **"Invalid api key"** error from NOWPayments

## ❌ Issue Found

The NOWPayments API key in your `.env` is being rejected:
- Current API Key: `68bf677c-2d43-4ebb-811a-7dee6f95f8dd`
- Error: `Invalid api key`

## ✅ Solutions

### Option 1: Validate Your NOWPayments Credentials

1. Go to [NOWPayments.io](https://nowpayments.io/)
2. Login to your account
3. Navigate to **Settings → API Keys**
4. Copy the **current valid API key**
5. Update `.env`:

```bash
NOWPAYMENTS_API_KEY=your_new_api_key_here
```

6. Restart your server

### Option 2: Test with Demo/Sandbox Mode

NOWPayments might be blocking the call. Test the API directly:

```bash
curl -X GET "https://api.nowpayments.io/v1/currencies" \
  -H "x-api-key: 68bf677c-2d43-4ebb-811a-7dee6f95f8dd"
```

If this fails, the API key is definitely invalid.

### Option 3: Mock the Payment for Local Testing

For now, let's test the payment flow without actual NOWPayments API calls.

## 🧪 Recommended Testing Approach

### Step 1: Verify Database Setup

```bash
# Check if tables exist
psql -U postgres -d talklivedb_localtesting -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" | grep -i coin
```

### Step 2: Direct Database Insert (Mock Payment)

```bash
# Create a test payment order directly
psql -U postgres -d talklivedb_localtesting << EOF
INSERT INTO "CoinPurchaseOrders" (
  user_id, order_id, coins, amount_usd, currency, 
  pay_currency, pay_amount, status, payment_address, 
  confirmation_count, coins_added, webhook_count, created_at, updated_at
) VALUES (
  1,
  'ORD-1-TEST-' || floor(random()*1000000)::TEXT,
  100,
  25.00,
  'BTC',
  'btc',
  '0.000625',
  'PENDING',
  '1A1z7agoat3wyYQDhcSqnDP5D6Co787D29',
  0,
  false,
  0,
  NOW(),
  NOW()
) RETURNING purchase_id, order_id, status;
EOF
```

### Step 3: Test Status Check

```bash
# Get the purchase_id from the insert above, then test:
curl -X GET "http://192.168.0.14:3000/api/payment/status/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InByaW1vY3lzdXNAZ21haWwuY29tIiwidXNlcl9uYW1lIjoiIiwibG9naW5fdHlwZSI6InNvY2lhbCIsImlhdCI6MTc3OTI1ODM4Nn0.t_pu9ZEAbh2CEsS38zM3-qVEt0LZHiyWHRiPatij9pY"
```

### Step 4: Test Webhook Processing

```bash
bash test_webhook.sh "ORD-1-TEST-YOUR_ID"
```

## 📋 Your Token Details

```json
{
  "user_id": 1,
  "email": "primocysus@gmail.com",
  "user_name": "",
  "login_type": "social",
  "iat": 1779258386
}
```

✅ Token is valid for testing

## 🔧 Fix the NOWPayments API Key

### For Production (Real Payments)

1. Verify NOWPayments account is active
2. Check API key hasn't expired
3. Verify API key has correct permissions
4. Try generating a new API key
5. Update `.env` and restart

### For Development (Local Testing)

Create a `.env.test` file:

```env
NOWPAYMENTS_API_KEY=test_key_only_for_local_testing
NOWPAYMENTS_IPN_SECRET=XVXWRGC-M7VMHPA-MTKZPF6-G2STJJF
```

Then create a mock service that bypasses NOWPayments API for local dev.

## 📊 Quick Test Checklist

- [ ] Verify NOWPayments API key is valid
- [ ] Check if you have API key permissions
- [ ] Restart server after updating `.env`
- [ ] Test with direct database insert
- [ ] Test webhook signature generation
- [ ] Test payment status retrieval

## 📞 Next Step

**Choose one:**

1. **Fix API Key** → Get valid API key from NOWPayments dashboard
2. **Mock Testing** → Use direct database inserts to test payment flow
3. **Both** → Fix API key AND create mock service for local dev

Let me know which approach you'd like to take!
