const jwt = require('jsonwebtoken');

// Secret key for signing tokens (replace with your own secret, store securely)
const secretKey = process.env.screteKey || 'your-secret-key';

const tokenExpiry = process.env.JWT_EXPIRY || '1h';  // Default token expiry (e.g., 1 hour)

// Generate JWT token
function generateToken(payload, expiresIn = tokenExpiry) {
    try {
        const token = jwt.sign(payload, secretKey);
        // const token = jwt.sign(payload, secretKey, { expiresIn: '1m' });

        return token;
    } catch (error) {
        console.log(error);
        
        throw new Error('Error generating token');
    }
}

// Verify JWT token
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;  // Return decoded token data if verification is successful
    } catch (error) {
        return null;  // Return null if token verification fails
    }
}

// Decode JWT token without verifying (useful to read payload data)
function decodeToken(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;  // Return decoded payload
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
