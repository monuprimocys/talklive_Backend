const crypto = require("crypto");
const db = require("../../../models/index");


function getBaseProductId(productId) {
  if (!productId) return null;
  return productId.split(":")[0].trim();
}

class RevenueCatWebhookService {

  // ── Signature verification ─────────────────────────────────────────────────

  static verifySignature(rawBody, authorizationHeader) {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[RC Webhook] REVENUECAT_WEBHOOK_SECRET is not set");
      return false;
    }
    if (!authorizationHeader) {
      console.warn("[RC Webhook] Missing Authorization header");
      return false;
    }

    const received = authorizationHeader.replace(/^Bearer\s+/i, "");

    console.log("Received:", received);
console.log("Expected Secret:", process.env.REVENUECAT_WEBHOOK_SECRET);
    if (received === secret) return true;

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(received);
    if (receivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  }

  // ── Main dispatcher ────────────────────────────────────────────────────────

  static async processEvent(payload) {
    const { event } = payload;
    const eventId = event.id;
    const eventType = event.type;

    const rawProductId = event.product_id;
    const productIdNewFormate = getBaseProductId(rawProductId);

    console.log("=========================RAW:============================", rawProductId);
    console.log("=========================CLEAN:============================", productIdNewFormate);
    console.log(`[RC Webhook] Processing event ${eventId} type=${eventType} product=${productIdNewFormate}`);

    const dbTransaction = await db.sequelize.transaction();
    try {
      switch (eventType) {
        case "INITIAL_PURCHASE":
          await this.handleInitialPurchase(event, productIdNewFormate, dbTransaction);
          break;
        case "RENEWAL":
          await this.handleRenewal(event, productIdNewFormate, dbTransaction);
          break;
        case "CANCELLATION":
          await this.handleCancellation(event, dbTransaction);
          break;
        case "EXPIRATION":
          await this.handleExpiration(event, dbTransaction);
          break;
        case "BILLING_ISSUE":
          await this.handleBillingIssue(event, dbTransaction);
          break;
        case "PRODUCT_CHANGE":
          await this.handleProductChange(event, productIdNewFormate, dbTransaction);
          break;
        case "UNCANCELLATION":
          await this.handleUncancellation(event, dbTransaction);
          break;
        case "TRANSFER":
          await this.handleTransfer(event, dbTransaction);
          break;

        default:
          console.log(`[RC Webhook] Unhandled event type: ${eventType}`);
      }
      await dbTransaction.commit();
      console.log(`[RC Webhook] Event ${eventId} committed`);
    } catch (err) {
      await dbTransaction.rollback();
      console.error(`[RC Webhook] Event ${eventId} rolled back:`, err);
      throw err;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  static async resolveUser(rcCustomerId, t) {

    console.log("Searching user for:", rcCustomerId);
    const numericUserId = Number(rcCustomerId);
    const whereOptions = [{ revenuecat_customer_id: rcCustomerId }];

    if (Number.isInteger(numericUserId) && numericUserId > 0) {
      whereOptions.push({ user_id: numericUserId });
    }

    const user = await db.User.findOne({
      where: {
        is_deleted: false,
        [db.Sequelize.Op.or]: whereOptions,
      },
      order: [["revenuecat_customer_id", "DESC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

      console.log("Resolved User:", user ? user.toJSON() : null);

    if (user && !user.revenuecat_customer_id) {
      await user.update({ revenuecat_customer_id: rcCustomerId }, { transaction: t });
    }

    return user;
  }



  static async resolvePlan(productId, t) {
    return db.Plan.findOne({
      where: { revenuecat_product_id: productId, is_deleted: false, is_active: true },
      transaction: t,
    });
  }

  static calculateEndDate(expirationAtMs, planType) {
    if (expirationAtMs) return new Date(expirationAtMs);
    const d = new Date();
    if (planType === "monthly") d.setMonth(d.getMonth() + 1);
    else if (planType === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setFullYear(d.getFullYear() + 100);
    return d;
  }

  static derivePlatform(store) {
    if (store === "APP_STORE" || store === "MAC_APP_STORE") return "ios";
    if (store === "PLAY_STORE") return "android";
    return "unknown";
  }



  // ── Event handlers ─────────────────────────────────────────────────────────

  static async handleInitialPurchase(event, productId, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) {
      console.warn(`[RC Webhook] INITIAL_PURCHASE: no user for RC id ${event.app_user_id}`);
      return;
    }

    const plan = await this.resolvePlan(productId, t);
    if (!plan) {
      console.warn(`[RC Webhook] INITIAL_PURCHASE: no plan for product ${productId}`);
      return;
    }

    const existing = await db.Subscription.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { webhook_event_id: event.id },
          { transaction_id: event.transaction_id }
        ]
      },
      transaction: t,
    });
    if (existing) {
      console.log(`[RC Webhook] INITIAL_PURCHASE already processed for event ${event.id} or transaction ${event.transaction_id}`);
      return;
    }

    const endDate = this.calculateEndDate(event.expiration_at_ms, plan.plan_type);

    const subscription = await db.Subscription.create({
      user_id: user.user_id,
      plan_id: plan.plan_id,
      payment_method_id: null,
      start_date: new Date(event.purchased_at_ms),
      end_date: endDate,
      transaction_id: event.transaction_id,
      status: "active",
      revenuecat_customer_id: event.app_user_id,
      original_transaction_id: event.original_transaction_id || event.transaction_id,
      platform: this.derivePlatform(event.store),
      renewal_count: 0,
      entitlement_name: event.entitlement_id || event.entitlement_ids?.[0] || "premium",
      webhook_event_id: event.id,
    }, { transaction: t });

    await user.update({
      is_premium: true,
      revenuecat_customer_id: event.app_user_id,
      subscription_expires_at: endDate,
    }, { transaction: t });



    console.log(`[RC Webhook] INITIAL_PURCHASE: subscription ${subscription.subscription_id} created for user ${user.user_id}`);
  }

  static async handleRenewal(event, productId, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) {
      console.warn(`[RC Webhook] RENEWAL: no user for RC id ${event.app_user_id}`);
      return;
    }

    const plan = await this.resolvePlan(productId, t);
    if (!plan) {
      console.warn(`[RC Webhook] RENEWAL: no plan for product ${productId}`);
      return;
    }

    const alreadyProcessed = await db.Subscription.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { webhook_event_id: event.id },
          { transaction_id: event.transaction_id }
        ]
      },
      transaction: t,
    });
    if (alreadyProcessed) {
      console.log(`[RC Webhook] RENEWAL already processed for event ${event.id} or transaction ${event.transaction_id}`);
      return;
    }

    const endDate = this.calculateEndDate(event.expiration_at_ms, plan.plan_type);
    const originalTxId = event.original_transaction_id || event.transaction_id;

    const existing = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (existing) {
      await existing.update({
        status: "active",
        end_date: endDate,
        transaction_id: event.transaction_id,
        webhook_event_id: event.id,
        renewal_count: (existing.renewal_count || 0) + 1,
      }, { transaction: t });
    } else {
      await db.Subscription.create({
        user_id: user.user_id,
        plan_id: plan.plan_id,
        payment_method_id: null,
        start_date: new Date(event.purchased_at_ms),
        end_date: endDate,
        transaction_id: event.transaction_id,
        status: "active",
        revenuecat_customer_id: event.app_user_id,
        original_transaction_id: originalTxId,
        platform: this.derivePlatform(event.store),
        renewal_count: 1,
        entitlement_name: event.entitlement_id || event.entitlement_ids?.[0] || "premium",
        webhook_event_id: event.id,
      }, { transaction: t });
    }

    await user.update({
      is_premium: true,
      subscription_expires_at: endDate,
    }, { transaction: t });



    console.log(`[RC Webhook] RENEWAL processed for user ${user.user_id} until ${endDate.toISOString()}`);
  }

  static async handleCancellation(event, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    // if (!user) return;

    if (!user) {
  console.warn(`[RC Webhook] INITIAL_PURCHASE: no user for RC id ${event.app_user_id}`);
  return;
}

    const originalTxId = event.original_transaction_id || event.transaction_id;
    const subscription = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (subscription) {
      await subscription.update({
        status: "canceled",
        cancellation_reason: event.cancellation_reason || null,
      }, { transaction: t });
    }

    console.log(`[RC Webhook] CANCELLATION recorded for user ${user.user_id}. Access until ${subscription?.end_date}`);
  }

  static async handleExpiration(event, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) return;

    const originalTxId = event.original_transaction_id || event.transaction_id;
    const subscription = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (subscription) {
      await subscription.update({
        status: "expired",
        end_date: event.expiration_at_ms ? new Date(event.expiration_at_ms) : subscription.end_date,
      }, { transaction: t });
    }

    const otherActive = await db.Subscription.findOne({
      where: { user_id: user.user_id, status: "active", is_deleted: false },
      transaction: t,
    });

    if (!otherActive) {
      await user.update({ is_premium: false, subscription_expires_at: null }, { transaction: t });
      console.log(`[RC Webhook] EXPIRATION: premium revoked for user ${user.user_id}`);
    }
  }

  static async handleBillingIssue(event, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) return;

    const originalTxId = event.original_transaction_id || event.transaction_id;
    const subscription = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (subscription) {
      await subscription.update({ status: "billing_issue" }, { transaction: t });
    }

    console.log(`[RC Webhook] BILLING_ISSUE for user ${user.user_id} — premium retained during grace period`);
  }

  static async handleProductChange(event, productId, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) return;

    const newPlan = await this.resolvePlan(productId, t);
    if (!newPlan) {
      console.warn(`[RC Webhook] PRODUCT_CHANGE: no plan for product ${productId}`);
      return;
    }

    const originalTxId = event.original_transaction_id || event.transaction_id;
    const subscription = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (subscription) {
      const endDate = this.calculateEndDate(event.expiration_at_ms, newPlan.plan_type);
      await subscription.update({
        plan_id: newPlan.plan_id,
        end_date: endDate,
        status: "active",
      }, { transaction: t });
      await user.update({ subscription_expires_at: endDate }, { transaction: t });
    }

    console.log(`[RC Webhook] PRODUCT_CHANGE: user ${user.user_id} switched to plan ${newPlan.plan_id}`);
  }

  static async handleUncancellation(event, t) {
    const user = await this.resolveUser(event.app_user_id, t);
    if (!user) return;

    const originalTxId = event.original_transaction_id || event.transaction_id;
    const subscription = await db.Subscription.findOne({
      where: { original_transaction_id: originalTxId, user_id: user.user_id },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (subscription) {
      await subscription.update({ status: "active", cancellation_reason: null }, { transaction: t });
    }

    await user.update({ is_premium: true }, { transaction: t });
    console.log(`[RC Webhook] UNCANCELLATION: premium restored for user ${user.user_id}`);
  }

  static async handleTransfer(event, t) {
    const payload = event;
    const newRcId = payload.transferred_to?.[0];
    const oldRcId = payload.transferred_from?.[0];

    if (!newRcId || !oldRcId) return;

    const newUser = await db.User.findOne({
      where: { revenuecat_customer_id: newRcId, is_deleted: false },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const oldUser = await db.User.findOne({
      where: { revenuecat_customer_id: oldRcId, is_deleted: false },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (oldUser) {
      await oldUser.update({ is_premium: false, subscription_expires_at: null }, { transaction: t });
      await db.Subscription.update(
        { status: "expired" },
        { where: { user_id: oldUser.user_id, status: "active" }, transaction: t }
      );
    }

    if (newUser) {
      const originalTxId = event.original_transaction_id || event.transaction_id;
      await db.Subscription.update(
        { user_id: newUser.user_id, revenuecat_customer_id: newRcId },
        { where: { original_transaction_id: originalTxId }, transaction: t }
      );
      await newUser.update({ is_premium: true, revenuecat_customer_id: newRcId }, { transaction: t });
    }

    console.log(`[RC Webhook] TRANSFER: ${oldRcId} → ${newRcId}`);
  }


}

module.exports = { RevenueCatWebhookService };