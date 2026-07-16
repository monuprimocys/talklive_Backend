const { ResponseHelper } = require("../../helper/response.helper");
const db = require("../../../models/index");

/**
 * POST /api/purchase/restore
 *
 * Called by the mobile app after it runs RevenueCat's restorePurchases().
 * The app sends the RC customer ID that RC assigned after restore.
 * We update our user record to link it to that RC customer and then
 * re-derive premium status from the subscriptions table.
 *
 * Security: we never trust a "is_premium: true" flag from the client.
 * Premium status is always derived from our own subscriptions table,
 * which is only written to by verified RC webhooks.
 */
const restorePurchases = async (req, res) => {
  try {
    const user_id = req.authData.user_id;
    const { revenuecat_customer_id } = req.body;

    if (!revenuecat_customer_id || typeof revenuecat_customer_id !== "string") {
      return ResponseHelper.badRequest(res, "revenuecat_customer_id is required");
    }

    const user = await db.User.findByPk(user_id);
    if (!user) return ResponseHelper.notFound(res, "User not found");

    // Link (or re-link) the RC customer id to this user
    await user.update({ revenuecat_customer_id });

    // Re-derive premium status from our own subscriptions table
    const now = new Date();
    const activeSubscription = await db.Subscription.findOne({
      where: {
        user_id,
        is_deleted: false,
        status: ["active", "billing_issue"],
        end_date: { [db.Sequelize.Op.gte]: now },
      },
      include: [{ model: db.Plan, as: "plan" }],
      order: [["createdAt", "DESC"]],
    });

    const is_premium = !!activeSubscription;
    const subscription_expires_at = activeSubscription?.end_date ?? null;

    await user.update({ is_premium, subscription_expires_at });

    return ResponseHelper.success(res, {
      is_premium,
      subscription_expires_at,
      revenuecat_customer_id,
    }, "Purchase restore completed");

  } catch (err) {
    return ResponseHelper.serverError(res, err.message);
  }
};

module.exports = { restorePurchases };