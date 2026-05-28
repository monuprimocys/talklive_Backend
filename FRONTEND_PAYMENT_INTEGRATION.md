# Frontend Payment Polling Integration Guide

## Overview

This guide explains how to integrate the **real-time payment status polling** system into the frontend. After a user creates a payment and is redirected to the NOWPayments invoice page, the frontend needs to poll for payment completion and redirect the user on success.

---

## 1. New Backend API

### `GET /api/payment/status-by-order/:order_id`

**Authentication:** Required (Bearer token)

**Purpose:** Frontend polls this endpoint every 5 seconds to check if a payment has been completed.

### Request

```http
GET /api/payment/status-by-order/ORD-387-1779958263470-lcjqxlezr
Authorization: Bearer <token>
```

### Response

```json
{
  "status": true,
  "data": {
    "success": true,
    "data": {
      "purchase_id": 12,
      "order_id": "ORD-387-1779958263470-lcjqxlezr",
      "payment_id": "5097729003",
      "status": "FINISHED",
      "payment_status": "finished",
      "coins": 100,
      "coins_added": true,
      "amount_usd": "25.00",
      "currency": "USD",
      "user_balance": 5100,
      "created_at": "2026-05-28T09:30:00.000Z",
      "updated_at": "2026-05-28T09:35:00.000Z",
      "confirmation_count": 3,
      "error_message": null
    }
  },
  "message": "Payment status retrieved",
  "toast": false
}
```

### `payment_status` Values

| Value | Meaning | Frontend Action |
|-------|---------|-----------------|
| `waiting` | Payment created, waiting for user to pay | Show "Waiting for payment..." |
| `confirming` | Payment detected, waiting for confirmations | Show "Payment detected, confirming..." |
| `confirmed` | Payment confirmed on blockchain | Show "Payment confirmed, processing..." |
| `sending` | Coins are being sent to user | Show "Processing your coins..." |
| `finished` | ✅ Payment complete, coins added | **Redirect to success page** |
| `failed` | ❌ Payment failed | Show error, allow retry |
| `expired` | ❌ Payment expired/cancelled | Show expired message |

---

## 2. Payment Flow Overview

```
User clicks "Buy Coins"
       ↓
POST /api/payment/create  →  Returns { order_id, payment_url }
       ↓
Frontend stores order_id in state/localStorage
       ↓
Frontend opens payment_url (NOWPayments invoice) in new tab or redirects
       ↓
Frontend starts polling GET /api/payment/status-by-order/:order_id every 5 seconds
       ↓
When payment_status === "finished"  →  Stop polling → Redirect to success
When payment_status === "failed" or "expired"  →  Stop polling → Show error
```

---

## 3. API Service Function

Add this to your API service file (e.g., `services/api.js` or `utils/apiService.js`):

```javascript
/**
 * Poll payment status by order_id
 * @param {string} orderId - The order_id from createPayment response
 * @returns {Promise<object>} - Payment status data
 */
export const getPaymentStatusByOrderId = async (orderId) => {
  const response = await axiosInstance.get(`/api/payment/status-by-order/${orderId}`);
  return response.data;
};
```

---

## 4. React Hook: `usePaymentPolling`

Create a custom hook for polling. This handles cleanup, prevents memory leaks, and auto-stops on completion.

### File: `hooks/usePaymentPolling.js`

```javascript
import { useState, useEffect, useRef, useCallback } from "react";
import { getPaymentStatusByOrderId } from "../services/api"; // adjust path

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_DURATION = 30 * 60 * 1000; // 30 minutes max

// Terminal statuses that stop polling
const TERMINAL_STATUSES = ["finished", "failed", "expired"];

export function usePaymentPolling(orderId, enabled = true) {
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("waiting");
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollStatus = useCallback(async () => {
    if (!orderId || !isMountedRef.current) return;

    try {
      const response = await getPaymentStatusByOrderId(orderId);

      if (!isMountedRef.current) return;

      if (response?.status && response?.data?.success) {
        const data = response.data.data;
        setPaymentData(data);
        setPaymentStatus(data.payment_status);
        setError(null);

        // Stop polling if terminal status reached
        if (TERMINAL_STATUSES.includes(data.payment_status)) {
          stopPolling();
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[PaymentPolling] Error:", err);
      setError(err?.response?.data?.message || "Failed to check payment status");
      // Don't stop polling on network errors - keep trying
    }
  }, [orderId, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!orderId || !enabled) {
      stopPolling();
      return;
    }

    // Initial poll immediately
    pollStatus();

    // Start interval polling
    setIsPolling(true);
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL);

    // Safety timeout - stop after 30 minutes
    timeoutRef.current = setTimeout(() => {
      console.warn("[PaymentPolling] Max poll duration reached, stopping");
      stopPolling();
      setPaymentStatus("expired");
    }, MAX_POLL_DURATION);

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [orderId, enabled, pollStatus, stopPolling]);

  return {
    paymentData,
    paymentStatus,
    isPolling,
    error,
    stopPolling,
  };
}
```

---

## 5. Payment Pending Page Component

### File: `pages/PaymentPending.jsx` (or `.tsx`)

```jsx
import React, { useEffect } from "react";
import { useRouter } from "next/router"; // or react-router
import { usePaymentPolling } from "../hooks/usePaymentPolling";

export default function PaymentPendingPage() {
  const router = useRouter();
  const { order_id } = router.query;

  // Start polling when order_id is available
  const { paymentData, paymentStatus, isPolling, error } = usePaymentPolling(
    order_id,
    !!order_id // enabled only when order_id exists
  );

  // Auto-redirect on success
  useEffect(() => {
    if (paymentStatus === "finished" && paymentData) {
      // Redirect to home or success page after short delay
      setTimeout(() => {
        router.push("/"); // or "/payment/success"
      }, 2000);
    }
  }, [paymentStatus, paymentData, router]);

  // Status-specific UI
  const renderStatusUI = () => {
    switch (paymentStatus) {
      case "waiting":
        return (
          <div>
            <div className="spinner" /> {/* Your loading spinner */}
            <h2>Waiting for Payment</h2>
            <p>Please complete your payment in the NOWPayments window.</p>
            <p>This page will update automatically.</p>
          </div>
        );

      case "confirming":
        return (
          <div>
            <div className="spinner" />
            <h2>Payment Detected!</h2>
            <p>Waiting for blockchain confirmations...</p>
            {paymentData?.confirmation_count > 0 && (
              <p>Confirmations: {paymentData.confirmation_count}</p>
            )}
          </div>
        );

      case "confirmed":
      case "sending":
        return (
          <div>
            <div className="spinner" />
            <h2>Payment Confirmed</h2>
            <p>Processing your coins...</p>
          </div>
        );

      case "finished":
        return (
          <div>
            <div className="success-icon">✅</div>
            <h2>Payment Successful!</h2>
            <p>{paymentData?.coins} coins have been added to your account.</p>
            <p>New balance: {paymentData?.user_balance} coins</p>
            <p>Redirecting...</p>
          </div>
        );

      case "failed":
        return (
          <div>
            <div className="error-icon">❌</div>
            <h2>Payment Failed</h2>
            <p>{paymentData?.error_message || "Something went wrong."}</p>
            <button onClick={() => router.push("/buy-coins")}>
              Try Again
            </button>
          </div>
        );

      case "expired":
        return (
          <div>
            <div className="error-icon">⏰</div>
            <h2>Payment Expired</h2>
            <p>The payment window has expired. Please try again.</p>
            <button onClick={() => router.push("/buy-coins")}>
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div>
            <div className="spinner" />
            <h2>Checking Payment Status...</h2>
          </div>
        );
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      {renderStatusUI()}
      {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}
      {isPolling && (
        <p style={{ color: "#888", marginTop: 20, fontSize: 12 }}>
          Auto-checking every 5 seconds...
        </p>
      )}
    </div>
  );
}
```

---

## 6. Integration into Existing Payment Creation Flow

After calling `POST /api/payment/create`, you get back an `order_id` and `payment_url`. Update your existing payment creation handler:

```javascript
// In your "Buy Coins" button handler or createPayment function:

const handleBuyCoins = async (planId) => {
  try {
    const response = await createPayment({ plan_id: planId, payment_method: "nowpayments" });

    if (response?.status && response?.data?.success) {
      const { order_id, payment_url } = response.data.data;

      // Store order_id for polling
      localStorage.setItem("pending_order_id", order_id);

      // Open NOWPayments invoice in new tab
      window.open(payment_url, "_blank");

      // Navigate to payment pending page
      router.push(`/payment/pending?order_id=${order_id}`);
    }
  } catch (error) {
    console.error("Payment creation failed:", error);
    // Show error toast
  }
};
```

---

## 7. Route Configuration

Add the new payment pending route to your Next.js pages or React Router config:

### Next.js (App Router):
```
app/payment/pending/page.jsx  →  PaymentPendingPage component
```

### Next.js (Pages Router):
```
pages/payment/pending.jsx  →  PaymentPendingPage component
```

### React Router:
```jsx
<Route path="/payment/pending" element={<PaymentPendingPage />} />
```

---

## 8. Handle Return from NOWPayments

When the user completes payment on NOWPayments and clicks the success/cancel button, they are redirected to:
- **Success:** `{baseUrl}/payment/success?order_id={order_id}`
- **Cancel:** `{baseUrl}/payment/cancel?order_id={order_id}`

On the success page, you can also start polling to confirm the webhook has been processed:

```javascript
// pages/payment/success.jsx
export default function PaymentSuccessPage() {
  const router = useRouter();
  const { order_id } = router.query;
  const { paymentStatus, paymentData } = usePaymentPolling(order_id, !!order_id);

  // The webhook may not have arrived yet, so keep polling
  // Once paymentStatus === "finished", show confirmed UI

  if (paymentStatus === "finished") {
    return <div>✅ Payment confirmed! {paymentData.coins} coins added.</div>;
  }

  return <div>⏳ Verifying your payment... Please wait.</div>;
}
```

---

## 9. localStorage Cleanup

Clean up the stored order_id when payment is terminal:

```javascript
// In the PaymentPending component, add:
useEffect(() => {
  if (["finished", "failed", "expired"].includes(paymentStatus)) {
    localStorage.removeItem("pending_order_id");
  }
}, [paymentStatus]);
```

---

## 10. Resume Pending Payment on App Load

Check for pending payments when the app loads:

```javascript
// In your main App component or layout:
useEffect(() => {
  const pendingOrderId = localStorage.getItem("pending_order_id");
  if (pendingOrderId) {
    // Redirect to pending page to resume polling
    router.push(`/payment/pending?order_id=${pendingOrderId}`);
  }
}, []);
```

---

## 11. Safety Checklist

- [x] **No duplicate polling:** `useEffect` cleanup stops intervals on unmount
- [x] **Max timeout:** Polling stops after 30 minutes
- [x] **Terminal states:** Polling stops on `finished`, `failed`, `expired`
- [x] **Auth required:** API verifies user owns the order
- [x] **Network errors:** Polling continues even if a request fails
- [x] **Memory leaks:** `isMountedRef` prevents state updates after unmount
- [x] **Coins safety:** Coins are only added by the backend webhook, never by frontend
- [x] **No breaking changes:** All existing APIs remain untouched

---

## 12. API Response Examples

### Payment Waiting (just created)
```json
{ "payment_status": "waiting", "coins_added": false, "status": "PENDING" }
```

### Payment Confirming (user paid, blockchain confirming)
```json
{ "payment_status": "confirming", "coins_added": false, "confirmation_count": 1 }
```

### Payment Finished (coins added)
```json
{ "payment_status": "finished", "coins_added": true, "user_balance": 5100 }
```

### Payment Failed
```json
{ "payment_status": "failed", "coins_added": false, "error_message": "Payment failed" }
```
