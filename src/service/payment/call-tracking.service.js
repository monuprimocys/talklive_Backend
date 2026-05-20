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
   * Start tracking a call session
   * @param {string} session_id - Unique call session ID
   * @param {number} from_user_id - Caller user ID
   * @param {number} to_user_id - Receiver user ID
   * @param {number} price_per_minute - Coins per minute
   * @param {string} call_type - VOICE_CALL or VIDEO_CALL
   * @returns {object} - Call session details
   */
  static startCallTracking(
    session_id,
    from_user_id,
    to_user_id,
    price_per_minute,
    call_type
  ) {
    const startTime = Date.now();

    this.activeCalls[session_id] = {
      session_id,
      from_user_id,
      to_user_id,
      price_per_minute,
      call_type,
      start_time: startTime,
      duration_seconds: 0,
      is_active: true,
      warnings_sent: [],
    };

    return {
      success: true,
      message: "Call tracking started",
      session_id,
      start_time: startTime,
    };
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
