const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const config = require("../../config/voipConfig");

function generateVoipToken() {
  const keyPath = path.join(__dirname, "../../certs/AuthKey_X7FGCTU477.p8");
  const privateKey = fs.readFileSync(keyPath);

  return jwt.sign({}, privateKey, {
    algorithm: "ES256",
    issuer: config.teamId,
    header: {
      alg: "ES256",
      kid: config.keyId,
    },
    expiresIn: "1h",
  });
}

module.exports = generateVoipToken;