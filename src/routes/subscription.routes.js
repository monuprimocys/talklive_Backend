const { Router } = require("express");
const { getPlans } = require("../controller/subscription/plan.controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const { restorePurchases } = require("../controller/purchase/restore.controller");

const router = Router();

// GET /api/subscription/plans — returns all active plans merged with live RevenueCat data
router.get("/plans", authMiddleware, getPlans);
router.post("/restore",  authMiddleware , restorePurchases)

module.exports = router;
