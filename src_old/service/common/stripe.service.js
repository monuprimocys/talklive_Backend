const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Payment Intent with static shipping
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {string} params.name - Customer full name
 * @param {number} params.amount - Amount in USD
 * @returns {Promise<string>} clientSecret
 */
async function createStripeIntent({ email, name, amount }) {
    if (!email || !name) throw new Error("Email and Name are required");
    if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

    // 1. Create customer
    const customer = await stripe.customers.create({
        email,
        name,
    });

    // 2. Create payment intent with static shipping
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert dollars to cents
        currency: "usd",
        customer: customer.id,
        receipt_email: email,
        description: "Reel Boost Purchase",
        automatic_payment_methods: { enabled: true },
        shipping: {
            name,
            address: {
                line1: "510 Townsend St",
                city: "San Francisco",
                state: "CA",
                postal_code: "98140",
                country: "US",
            },
        },
    });

    // 3. Return client secret
    return paymentIntent.client_secret;
}


module.exports = {
    createStripeIntent
}
