const db = require("../../models");

/**
 * Check if a user has an active subscription
 * @param {number} user_id - The user ID to check
 * @returns {Promise<boolean>} - true if user has active subscription, false otherwise
 */
async function isUserVerified(user_id) {
  try {
    if (!user_id) {
      return false;
    }

    const user = await db.User.findOne({
      where: { user_id },
      attributes: ['is_premium', 'subscription_expires_at']
    });

    if (!user) {
      return false;
    }

    // User is verified if they have active premium status
    // and subscription is not expired
    const isPremiumActive = user.is_premium && 
      user.subscription_expires_at && 
      new Date(user.subscription_expires_at) > new Date();

    return isPremiumActive;
  } catch (error) {
    console.error("Error checking user verification status:", error);
    return false;
  }
}

/**
 * Add is_verified field to user records
 * @param {Array} userRecords - Array of user objects
 * @returns {Promise<Array>} - Array of user objects with is_verified field
 */
async function addVerificationStatusToUsers(userRecords) {
  if (!userRecords || userRecords.length === 0) {
    return userRecords;
  }

  try {
    const userIds = userRecords.map(u => u.user_id);
    
    // Fetch all users' subscription status in a single query
    const users = await db.User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'is_premium', 'subscription_expires_at']
    });

    const now = new Date();
    const verificationMap = new Map();

    users.forEach(user => {
      const isPremiumActive = user.is_premium && 
        user.subscription_expires_at && 
        new Date(user.subscription_expires_at) > now;
      verificationMap.set(user.user_id, isPremiumActive);
    });

    // Add is_verified field to each user record
    return userRecords.map(user => ({
      ...user,
      is_verified: verificationMap.get(user.user_id) || false
    }));
  } catch (error) {
    console.error("Error adding verification status to users:", error);
    // Return original records if error occurs
    return userRecords.map(user => ({
      ...user,
      is_verified: false
    }));
  }
}

/**
 * Add is_verified field to a single user record
 * @param {Object} userRecord - Single user object
 * @returns {Promise<Object>} - User object with is_verified field
 */
async function addVerificationStatusToUser(userRecord) {
  if (!userRecord) {
    return userRecord;
  }

  try {
    const isVerified = await isUserVerified(userRecord.user_id);
    return {
      ...userRecord,
      is_verified: isVerified
    };
  } catch (error) {
    console.error("Error adding verification status to user:", error);
    return {
      ...userRecord,
      is_verified: false
    };
  }
}

module.exports = {
  isUserVerified,
  addVerificationStatusToUsers,
  addVerificationStatusToUser
};

 