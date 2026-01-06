// Import dependencies if running in Node.js
if (typeof require !== 'undefined') {
  var Config = require('./Config');
  var Database = require('./Database');
}

var Auth = {

  /**
   * Register a new user.
   * Logic: Password is the last 4 digits of the phone number.
   */
  register: function(data) {
    // Basic validation
    if (!data.email || !data.phone || !data.full_name || !data.role) {
      return { success: false, message: "Missing required fields" };
    }

    // Default password logic: Last 4 digits of phone
    var phoneStr = String(data.phone).trim();
    if (phoneStr.length < 4) {
      return { success: false, message: "Phone number too short" };
    }
    var rawPassword = phoneStr.slice(-4);
    var passwordHash = this.hashPassword(rawPassword);

    // Construct user object
    var newUser = {
      user_id: "U-" + new Date().getTime(), // Simple ID generation
      email: data.email,
      full_name: data.full_name,
      phone: phoneStr,
      role: data.role,
      status: Config.STATUS.ACTIVE,
      password_hash: passwordHash
    };

    // Save to Database (Mock or Real)
    try {
      Database.save(Database.SHEETS.USERS, newUser);
      return { success: true, data: newUser, debug_password: rawPassword };
    } catch (e) {
      return { success: false, message: "Database Error: " + e.toString() };
    }
  },

  /**
   * Login user.
   */
  login: function(email, password) {
    // 1. Validate Input
    if (!email || !password) {
      return { success: false, message: "Email and Password required" };
    }

    // 2. Fetch User from DB
    var user = Database.findByEmail(email);
    if (!user) {
       return { success: false, message: "User not found" };
    }

    // 3. Check Status
    if (user.status !== Config.STATUS.ACTIVE) {
      return { success: false, message: "User account is inactive" };
    }

    // 4. Verify Password
    var inputHash = this.hashPassword(password);
    if (user.password_hash === inputHash) {
      // Remove password from response
      delete user.password_hash;
      return { success: true, token: "mock_token_" + user.user_id, user: user };
    } else {
      return { success: false, message: "Invalid password" };
    }
  },

  /**
   * Simple hash function (SHA-256 simulation).
   * In GAS, use Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
   */
  hashPassword: function(value) {
    if (typeof Utilities !== 'undefined') {
      // Google Apps Script environment
      var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
      var txtHash = '';
      for (var i = 0; i < rawHash.length; i++) {
        var hashVal = rawHash[i];
        if (hashVal < 0) {
          hashVal += 256;
        }
        if (hashVal.toString(16).length == 1) {
          txtHash += '0';
        }
        txtHash += hashVal.toString(16);
      }
      return txtHash;
    } else {
      // Node.js environment (Mock for testing)
      // Using crypto module if available, or simple mock
      try {
        var crypto = require('crypto');
        return crypto.createHash('sha256').update(value).digest('hex');
      } catch (e) {
        return "mock_hash_" + value;
      }
    }
  }
};

if (typeof module !== 'undefined') {
  module.exports = Auth;
}
