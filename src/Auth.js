// Authentication Logic

if (typeof require !== 'undefined') {
    var Config = require('./Config');
    var Database = require('./Database');
}

var Auth = {
    /**
     * Validates user login credentials.
     * @param {string} identifier - Email or Phone
     * @param {string} password
     * @returns {Object} Result object { success: boolean, message: string, token: string, user: Object }
     */
    login: function(identifier, password) {
        var user = Database.findUser(identifier);

        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        if (user.status !== Config.STATUS_ACTIVE) {
            // Special case: INACTIVE users can login but have restricted access
        }

        var inputHash = this.hashPassword(password);

        if (inputHash !== user.password_hash) {
            return { success: false, message: 'Invalid password.' };
        }

        var token = this.generateToken(user);

        // Filter sensitive info from user object before returning
        var safeUser = {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status
        };

        return { success: true, message: 'Login successful.', token: token, user: safeUser };
    },

    /**
     * Hashes a password using SHA-256.
     * @param {string} password
     * @returns {string} Hex string of the hash
     */
    hashPassword: function(password) {
        if (typeof Utilities === 'undefined') {
            // Mock for Node.js
            var crypto = require('crypto');
            return crypto.createHash('sha256').update(password).digest('hex');
        }

        var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
        return rawHash.map(function(byte) {
            // Convert to hex
            var hex = (byte < 0 ? byte + 256 : byte).toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        }).join('');
    },

    /**
     * Generates a simple token.
     * @param {Object} user
     * @returns {string}
     */
    generateToken: function(user) {
        var payload = JSON.stringify({
            user_id: user.user_id,
            role: user.role,
            exp: new Date().getTime() + 3600000 // 1 hour
        });

        var secret = 'DIPLOMA_ILMI_SECRET'; // Should be in script properties

        var signature = this.hashHmac(payload, secret);

        // Base64 encode payload
        var encodedPayload = typeof Utilities !== 'undefined'
            ? Utilities.base64Encode(payload)
            : Buffer.from(payload).toString('base64');

        return encodedPayload + "." + signature;
    },

    hashHmac: function(data, secret) {
        if (typeof Utilities === 'undefined') {
            // Mock for Node.js
            var crypto = require('crypto');
            return crypto.createHmac('sha256', secret).update(data).digest('hex');
        }

        var rawHash = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, data, secret);
        return rawHash.map(function(byte) {
            var hex = (byte < 0 ? byte + 256 : byte).toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        }).join('');
    }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = Auth;
}
