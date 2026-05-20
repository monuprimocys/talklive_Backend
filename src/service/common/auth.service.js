const bcrypt = require('bcrypt');

// Number of salt rounds (10 is a reasonable default)
const SALT_ROUNDS = 13;

const AuthService = {
    // Function to encrypt (hash) the password
    encryptPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(SALT_ROUNDS);
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            throw new Error('Error encrypting password');
        }
    },

    // Function to compare a plain password with a hashed password
    comparePassword: async (password, hashedPassword) => {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword);
            return isMatch;
        } catch (error) {
            throw new Error('Error comparing passwords');
        }
    }
};




module.exports = AuthService;
