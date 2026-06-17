import axios from "axios";

export const sendCryptoWithdrawal = async ({ amount, currency, address }) => {
    try {
        if (!process.env.NOWPAYMENTS_API_KEY) {
            throw new Error("NOWPAYMENTS API KEY missing in .env");
        }

        console.log("🚀 Sending payout:", { amount, currency, address });

        const response = await axios.post(
            "https://api.nowpayments.io/v1/payout",
            {
                withdrawals: [
                    {
                        address: address,
                        currency: currency.toLowerCase(),
                        amount: Number(amount)
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.NOWPAYMENTS_API_KEY}`, // ✅ FIXED
                    "Content-Type": "application/json"
                },
                timeout: 20000
            }
        );

        console.log("✅ NOWPayments Response:", response.data);

        return response.data;

    } catch (error) {
        console.error("❌ NOWPayments Error FULL 👉", {
            message: error.message,
            data: error.response?.data
        });

        throw new Error(
            error.response?.data?.message || "Crypto payout failed"
        );
    }
};