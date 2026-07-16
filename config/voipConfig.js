require("dotenv").config();

module.exports = {
  teamId: process.env.PUSH_TEAM_ID,
  keyId: process.env.PUSH_KEY_ID,
  bundleId: process.env.PUSH_BUNDLE_ID,
  production: process.env.PUSH_PRODUCTION === "true",
};