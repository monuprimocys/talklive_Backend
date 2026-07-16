const db = require("../../../models");

/**
 * Balance Validator Service
 * Validates if a user has sufficient coins for an interaction
 */

class BalanceValidator {
  /**
   * Check if user has sufficient coins
   * @param {number} user_id - User ID checking balance
   * @param {number} coins_required - Coins needed for transaction
   * @returns {object} - {hasBalance: boolean, available_coins: number, message: string}
   */
  static async validateBalance(user_id, coins_required) {
    try {
      const user = await db.User.findByPk(user_id);

      if (!user) {
        return {
          hasBalance: false,
          available_coins: 0,
          message: "User not found",
          error_code: "USER_NOT_FOUND",
        };
      }

      const available_coins = user.available_coins || 0;

      if (available_coins < coins_required) {
        return {
          hasBalance: false,
          available_coins,
          coins_required,
          coins_short: coins_required - available_coins,
          message: `Insufficient coins. Required: ${coins_required}, Available: ${available_coins}`,
          error_code: "INSUFFICIENT_COINS",
        };
      }

      return {
        hasBalance: true,
        available_coins,
        message: "Sufficient balance",
      };
    } catch (error) {
      console.error("Balance validation error:", error);
      return {
        hasBalance: false,
        message: "Error validating balance",
        error_code: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Validate recipient pricing setup
   * @param {number} recipient_id - Recipient user ID
   * @param {string} type - Communication type: MESSAGE, CALL, VIDEO_CALL
   * @returns {object} - {isPricingEnabled: boolean, price: number, message: string}
   */
  static async validateRecipientPricing(recipient_id, type) {
    try {
      const recipient = await db.User.findByPk(recipient_id);

      if (!recipient) {
        return {
          isPricingEnabled: false,
          price: 0,
          message: "Recipient not found",
          error_code: "RECIPIENT_NOT_FOUND",
        };
      }

      let price = 0;
      let isPricingEnabled = false;

      switch (type) {
        case "MESSAGE":
          price = recipient.message_price || 0;
          isPricingEnabled = price > 0;
          break;
        case "VOICE_CALL":
          price = recipient.call_price || 0;
          isPricingEnabled = price > 0;
          break;
        case "VIDEO_CALL":
          price = recipient.video_call_price || 0;
          isPricingEnabled = price > 0;
          break;
        default:
          return {
            isPricingEnabled: false,
            price: 0,
            message: "Invalid communication type",
            error_code: "INVALID_TYPE",
          };
      }

      return {
        isPricingEnabled,
        price,
        message: isPricingEnabled
          ? `Recipient charges ${price} coins per ${type.toLowerCase()}`
          : `Recipient does not charge for ${type.toLowerCase()}`,
      };
    } catch (error) {
      console.error("Pricing validation error:", error);
      return {
        isPricingEnabled: false,
        price: 0,
        message: "Error validating pricing",
        error_code: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Validate pre-call requirements
   * @param {number} sender_id - Sender user ID
   * @param {number} recipient_id - Recipient user ID
   * @param {string} call_type - VOICE_CALL or VIDEO_CALL
   * @returns {object} - Validation result with pricing info
   */
  static async validatePreCallRequirements(sender_id, recipient_id, call_type) {
    try {
      if (sender_id === recipient_id) {
        return {
          isValid: false,
          message: "Cannot call yourself",
          error_code: "INVALID_CALL",
        };
      }

      // Check recipient pricing
      const pricingValidation = await this.validateRecipientPricing(
        recipient_id,
        call_type
      );

      if (!pricingValidation.isPricingEnabled) {
        return {
          isValid: true, // Allow call if no pricing set
          requiresPayment: false,
          price: 0,
          message: "Recipient does not charge for calls",
        };
      }

      // Check sender balance (minimum 1 minute worth)
      const minCoinsRequired = pricingValidation.price;
      const balanceValidation = await this.validateBalance(
        sender_id,
        minCoinsRequired
      );

      if (!balanceValidation.hasBalance) {
        return {
          isValid: false,
          requiresPayment: true,
          ...balanceValidation,
        };
      }

      return {
        isValid: true,
        requiresPayment: true,
        price: pricingValidation.price,
        call_type,
        available_minutes: Math.floor(
          balanceValidation.available_coins / pricingValidation.price
        ),
        message: "Ready for call",
      };
    } catch (error) {
      console.error("Pre-call validation error:", error);
      return {
        isValid: false,
        message: "Error validating call requirements",
        error_code: "VALIDATION_ERROR",
      };
    }
  }
}

module.exports = BalanceValidator;
