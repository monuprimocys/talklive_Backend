const { generalResponse } = require("../../helper/response.helper");
const { RevenueCatService } = require("../../service/revenuecat/revenuecat.service");
const db = require("../../../models");

/**
 * GET /api/subscription/plans
 * Returns all active plans. If RevenueCat is reachable, augments with live
 * pricing / offering data. Falls back to the local DB-only list on error.
 */
async function getPlans(req, res) {
    try {
        // 1. Fetch plans stored locally
        const localPlans = await db.Plan.findAll({
            where: { is_active: true, is_deleted: false },
            order: [["createdAt", "ASC"]],
        });

        // 2. Try to fetch offerings from RevenueCat
        let rcOfferings = null;
        try {
            const appUserId = req.authData?.user_id ? String(req.authData.user_id) : "anonymous";
            const offeringsData = await RevenueCatService.getOfferings(appUserId);
            rcOfferings = offeringsData?.offerings ?? null;
        } catch (rcErr) {
            console.warn("[PlanController] Could not fetch RC offerings:", rcErr.message);
        }

        // 3. Build a quick lookup: productId → RC package info
        const rcMap = {};
        if (rcOfferings) {
            for (const offering of rcOfferings) {
                for (const pkg of offering.packages ?? []) {
                    const productId = pkg.platform_product_identifier;
                    if (productId) rcMap[productId] = pkg;
                }
            }
        }

        // 4. Merge local plan data with live RC info
        const plans = localPlans.map((plan) => {
            const p = plan.toJSON();
            let features = [];
            try { features = JSON.parse(p.features || "[]"); } catch { features = []; }

            const rcPkg = rcMap[p.revenuecat_product_id] || null;

            return {
                plan_id: p.plan_id,
                plan_type: p.plan_type,
                price: rcPkg?.store_product?.price ?? p.price,
                currency: rcPkg?.store_product?.currency_code ?? p.currency,
                features,
                product_type: p.product_type,
                platform: p.platform,
                revenuecat_product_id: p.revenuecat_product_id,
                is_revenuecat_managed: p.is_revenuecat_managed,
                // RC-live fields (null if RC is unreachable)
                rc_identifier: rcPkg?.identifier ?? null,
                rc_description: rcPkg?.store_product?.description ?? null,
                rc_price_string: rcPkg?.store_product?.price_string ?? null,
            };
        });

        return generalResponse(res, plans, "Plans fetched successfully", true, false, 200);
    } catch (error) {
        console.error("[PlanController] Error in getPlans:", error);
        return generalResponse(res, {}, "Something went wrong while fetching plans", false, true, 500);
    }
}

module.exports = { getPlans };
