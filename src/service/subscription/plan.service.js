const db = require('../../../models/index');

class PlanService {

  async getAllPlans(user_id, filters) {
    try {
      const where = { is_deleted: false };

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.plan_type) {
        where.plan_type = filters.plan_type;
      }

      // ✅ Get all plans
      const plans = await db.Plan.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });

      // ✅ Get user's latest subscription
      const subscription = await db.Subscription.findOne({
        where: {
          user_id,
          is_deleted: false,
        },
        order: [["createdAt", "DESC"]],
      });

      const now = new Date();

      // ✅ Map plans with subscription info
      return plans.map((plan) => {
        const isSubscribed = subscription?.plan_id === plan.plan_id;

        let isExpired = false;

        if (isSubscribed && subscription?.end_date) {
          isExpired = new Date(subscription.end_date) < now;
        }

        return {
          ...plan.toJSON(),
          features: JSON.parse(plan.features || "[]"),

          // 🔥 NEW FIELDS
          is_subscribed: isSubscribed,
          is_expired: isSubscribed ? isExpired : false,
        };
      });

    } catch (error) {
      throw new Error(
        `Failed to fetch plans: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getPlanById(planId) {
    try {
      const plan = await db.Plan.findOne({
        where: { plan_id: planId, is_deleted: false },
      });

      if (!plan) return null;

      return {
        ...plan.toJSON(),
        features: JSON.parse(plan.features || "[]"),
      };

    } catch (error) {
      throw new Error(`Failed to fetch plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync plans from RevenueCat to database
   */
  async syncWithRevenueCat() {
    try {
      const { RevenueCatService } = require("../revenuecat/revenuecat.service");
      const offerings = await RevenueCatService.getOfferings("admin_sync");

      if (!offerings || !offerings.offerings) {
        console.warn("[PlanService] No offerings found to sync");
        return;
      }

      const defaultOffering = offerings.offerings.find((o) => o.identifier === offerings.current_offering_id) || offerings.offerings[0];
      const packages = defaultOffering?.packages || [];

      console.log(`[PlanService] Syncing ${packages.length} packages from RevenueCat...`);

      for (const pkg of packages) {
        const productId = pkg.platform_product_identifier;
        const identifier = pkg.identifier;

        // Determine product type
        let productType = 'consumable';
        if (identifier.startsWith('$rc_') || productId.includes('plan')) {
          productType = 'subscription';
        }

        // Determine plan type
        let planType = 'monthly';
        if (identifier === '$rc_annual') planType = 'yearly';

        await db.Plan.findOrCreate({
          where: { revenuecat_product_id: productId },
          defaults: {
            plan_type: planType,
            price: 0,
            currency: "USD",
            features: JSON.stringify([`Access to ${productId}`]),
            is_active: true,
            is_deleted: false,
            revenuecat_product_id: productId,
            product_type: productType,
            platform: "both",
            is_revenuecat_managed: true,
          }
        });
      }

      console.log("[PlanService] RevenueCat sync completed successfully");
    } catch (error) {
      console.error("[PlanService] Error syncing with RevenueCat:", error);
    }
  }
}

const planService = new PlanService();
module.exports = { PlanService, planService };