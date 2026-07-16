/**
 * Call Tracking Service
 * Manages real-time call duration tracking and per-minute coin deduction
 */

class CallTrackingService {
  // Store active calls in memory (in production, use Redis)
  static activeCalls = {};
  // Map room_id -> payment/session info
  static activePayments = {};

  /**
   * Prepare call tracking (during ringing)
   * @param {string} session_id - Unique call session ID
   * @param {number} from_user_id - Caller user ID
   * @param {number} to_user_id - Receiver user ID
   * @param {number} price_per_minute - Coins per minute
   * @param {string} call_type - VOICE_CALL or VIDEO_CALL
   * @returns {object} - Prepared session
   */
  static prepareCallTracking(
    session_id,
    call_id,
    from_user_id,
    to_user_id,
    price_per_minute,
    call_type
  ) {
    const session = {
      session_id,
      call_id,
      from_user_id,
      to_user_id,
      price_per_minute,
      call_type,
      is_active: false, // Not active until accepted
      start_time: null,
      last_billing_time: null,
      billing_interval: null,
      warnings_sent: [],
    };

    this.activeCalls[session_id] = session;
    return session;
  }

  /**
   * Start billing loop (when call is accepted)
   * @param {string} session_id - Call session ID
   * @param {string} room_id - Socket room ID
   * @param {function} onTerminate - Callback to terminate call via socket
   */
  static async startBillingLoop(session_id, room_id, onTerminate) {
    const session = this.activeCalls[session_id];
    if (!session || session.billing_interval) return;

    const CoinsService = require("./coins.service");
    const { emitEvent } = require("../common/socket.service");
    const { getUser } = require("../repository/user.service");

    session.is_active = true;
    session.start_time = Date.now();
    session.last_billing_time = session.start_time;
    session.room_id = room_id;

    // Start per-minute billing loop
    if (session.price_per_minute > 0) {
      // 1. Finalize the first minute (already locked during makeCall)
      const finalizeResult = await CoinsService.finalizeLockedCoins(
        session.from_user_id,
        session.to_user_id,
        session.price_per_minute,
        session.call_type
      );

      if (finalizeResult.success) {
        console.log(`[Billing] ✅ Finalized first minute for session ${session_id}`);

        // Emit balance updates to both users
        const caller = await getUser({ user_id: session.from_user_id });
        const recipient = await getUser({ user_id: session.to_user_id });

        if (caller) {
          emitEvent(caller.socket_id, "balance_update", {
            available_coins: caller.available_coins,
          });
        }
        if (recipient) {
          emitEvent(recipient.socket_id, "balance_update", {
            available_coins: recipient.available_coins,
          });
        }
      }

      // 2. Start interval for subsequent minutes (starting from minute 2)
      session.billing_interval = setInterval(async () => {
        await this.processMinuteBilling(session_id, onTerminate);
      }, 60000); // Every 60 seconds
    }
  }

  /**
   * Process per-minute billing for an active call
   * @param {string} session_id - Call session ID
   * @param {function} onTerminate - Callback to terminate call
   */
  static async processMinuteBilling(session_id, onTerminate) {
    const session = this.activeCalls[session_id];
    if (!session || !session.is_active) return;

    const CoinsService = require("./coins.service");
    const { emitEvent } = require("../common/socket.service");
    const { getUser } = require("../repository/user.service");

    try {
      // Deduct coins for the next minute
      const result = await CoinsService.deductCoins(
        session.from_user_id,
        session.to_user_id,
        session.price_per_minute,
        session.call_type,
        {
          session_id: session.session_id,
          description: `Per-minute billing for ${session.call_type}`,
        }
      );

      if (!result.success) {
        console.log(`[Billing] ❌ Insufficient coins for session ${session_id}. Terminating.`);

        // Auto-terminate call
        this.terminateCall(session_id, "INSUFFICIENT_COINS");

        // ✅ Update DB status
        const call_service = require("../repository/call.service");
        const message_service = require("../repository/Message.service");
        const call = await call_service.getCall({ call_id: session.call_id });

        if (call) {
          const duration = Math.floor((Date.now() - new Date(call.start_time)) / 1000);

          await call_service.updateCallStatus(session.call_id, {
            call_status: "ended",
            end_time: new Date(),
            call_duration: duration,
            current_users: [],
          });

          await message_service.updateMessage(
            { message_id: call.message_id },
            { message_content: "ended" }
          );
        }

        if (onTerminate) {
          onTerminate(session.room_id, "INSUFFICIENT_COINS");
        }
      } else {
        session.last_billing_time = Date.now();
        console.log(`[Billing] ✅ Deducted ${session.price_per_minute} coins for session ${session_id}`);

        // Emit balance updates to both users
        const caller = await getUser({ user_id: session.from_user_id });
        const recipient = await getUser({ user_id: session.to_user_id });

        if (caller) {
          emitEvent(caller.socket_id, "balance_update", {
            available_coins: caller.available_coins,
          });
        }
        if (recipient) {
          emitEvent(recipient.socket_id, "balance_update", {
            available_coins: recipient.available_coins,
          });
        }
      }
    } catch (error) {
      console.error(`[Billing] ❌ Error in minute billing for session ${session_id}:`, error);
    }
  }

  /**
   * Get current call duration and cost
   * @param {string} session_id - Call session ID
   * @returns {object} - Duration and cost details
   */
  static getCallMetrics(session_id) {
    const callSession = this.activeCalls[session_id];

    if (!callSession) {
      return {
        success: false,
        message: "Call session not found",
        error_code: "SESSION_NOT_FOUND",
      };
    }

    if (!callSession.is_active) {
      return {
        success: false,
        message: "Call session has ended",
        error_code: "SESSION_ENDED",
      };
    }

    const current_time = Date.now();
    const duration_ms = current_time - callSession.start_time;
    const duration_seconds = Math.floor(duration_ms / 1000);
    const duration_minutes = Math.ceil(duration_seconds / 60);
    const cost_so_far = duration_minutes * callSession.price_per_minute;

    return {
      success: true,
      metrics: {
        session_id,
        duration_seconds,
        duration_minutes,
        price_per_minute: callSession.price_per_minute,
        cost_so_far,
        call_type: callSession.call_type,
      },
    };
  }

  /**
   * Check if user should be warned about low balance
   * @param {string} session_id - Call session ID
   * @param {number} available_coins - User's available coins
   * @returns {object} - Warning status
   */
  static checkLowBalanceWarning(session_id, available_coins) {
    const callSession = this.activeCalls[session_id];

    if (!callSession || !callSession.is_active) {
      return {
        shouldWarn: false,
        message: "Call session not found or ended",
      };
    }

    const metrics = this.getCallMetrics(session_id);

    if (!metrics.success) {
      return {
        shouldWarn: false,
        message: "Cannot calculate metrics",
      };
    }

    const price_per_minute = callSession.price_per_minute;
    const minutes_remaining = Math.floor(available_coins / price_per_minute);

    // Warn when less than 1 minute remaining
    const shouldWarn = minutes_remaining < 1 && !callSession.warnings_sent.includes("LOW_BALANCE");

    if (shouldWarn) {
      callSession.warnings_sent.push("LOW_BALANCE");
    }

    return {
      shouldWarn,
      minutes_remaining,
      available_coins,
      message: shouldWarn
        ? `Less than 1 minute remaining (${available_coins} coins)`
        : `${minutes_remaining} minutes remaining`,
    };
  }

  /**
   * End call tracking and calculate final cost
   * @param {string} session_id - Call session ID
   * @returns {object} - Final call details
   */
  static endCallTracking(session_id) {
    const callSession = this.activeCalls[session_id];

    if (!callSession) {
      return {
        success: false,
        message: "Call session not found",
        error_code: "SESSION_NOT_FOUND",
      };
    }

    // Stop billing interval
    if (callSession.billing_interval) {
      clearInterval(callSession.billing_interval);
      callSession.billing_interval = null;
    }

    const end_time = Date.now();
    const duration_ms = end_time - callSession.start_time;
    const duration_seconds = Math.floor(duration_ms / 1000);
    const duration_minutes = Math.ceil(duration_seconds / 60);
    const total_cost = duration_minutes * callSession.price_per_minute;

    // Mark as inactive but keep record for history
    callSession.is_active = false;
    callSession.end_time = end_time;
    callSession.final_duration_seconds = duration_seconds;
    callSession.final_duration_minutes = duration_minutes;
    callSession.final_cost = total_cost;

    return {
      success: true,
      message: "Call tracking ended",
      call_details: {
        session_id,
        call_type: callSession.call_type,
        from_user_id: callSession.from_user_id,
        to_user_id: callSession.to_user_id,
        duration_seconds,
        duration_minutes,
        price_per_minute: callSession.price_per_minute,
        total_cost,
        start_time: callSession.start_time,
        end_time,
      },
    };
  }

  /**
   * Terminate call immediately (due to disconnect or low balance)
   * @param {string} session_id - Call session ID
   * @param {string} reason - Reason for termination
   * @returns {object} - Termination details
   */
  static terminateCall(session_id, reason = "User disconnected") {
    const callSession = this.activeCalls[session_id];

    if (!callSession) {
      return {
        success: false,
        message: "Call session not found",
        error_code: "SESSION_NOT_FOUND",
      };
    }

    // Stop billing interval
    if (callSession.billing_interval) {
      clearInterval(callSession.billing_interval);
      callSession.billing_interval = null;
    }

    const end_time = Date.now();
    const duration_ms = end_time - callSession.start_time;
    const duration_seconds = Math.floor(duration_ms / 1000);
    const duration_minutes = Math.ceil(duration_seconds / 60);
    const total_cost = duration_minutes * callSession.price_per_minute;

    callSession.is_active = false;
    callSession.end_time = end_time;
    callSession.final_duration_seconds = duration_seconds;
    callSession.final_duration_minutes = duration_minutes;
    callSession.final_cost = total_cost;
    callSession.termination_reason = reason;

    return {
      success: true,
      message: `Call terminated: ${reason}`,
      call_details: {
        session_id,
        duration_seconds,
        duration_minutes,
        total_cost,
        termination_reason: reason,
      },
    };
  }

  /**
   * Get active call count (for monitoring/stats)
   * @returns {number} - Number of active calls
   */
  static getActiveCallCount() {
    return Object.values(this.activeCalls).filter((c) => c.is_active).length;
  }

  /**
   * Clean up old sessions (older than 1 hour)
   */
  static cleanupOldSessions() {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();

    Object.keys(this.activeCalls).forEach((session_id) => {
      const session = this.activeCalls[session_id];
      if (!session.is_active && now - session.end_time > ONE_HOUR_MS) {
        delete this.activeCalls[session_id];
      }
    });
  }

  /**
   * Get session details (for debugging/monitoring)
   * @param {string} session_id - Call session ID
   * @returns {object} - Session details
   */
  static getSessionDetails(session_id) {
    const session = this.activeCalls[session_id];

    if (!session) {
      return {
        success: false,
        message: "Session not found",
        error_code: "SESSION_NOT_FOUND",
      };
    }

    return {
      success: true,
      data: session,
    };
  }
}

// Run cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    CallTrackingService.cleanupOldSessions();
  }, 30 * 60 * 1000);
}

module.exports = CallTrackingService;

