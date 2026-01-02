// src/Auth.js

// Ensure dependencies
if (typeof Database === 'undefined') {
  if (typeof require !== 'undefined') {
    var Database = require('./Database');
    var Utils = require('./Utils');
    var Config = require('./Config');
  } else {
    throw new Error('Dependencies not loaded');
  }
}

var Auth = {
  login: function(identifier, password) {
    var user = Database.findUser(identifier);
    if (!user) {
      return Utils.createResponse(false, 'User not found');
    }

    var hashedPassword = Utils.hashPassword(password);
    if (user.password_hash === hashedPassword) {
      // Generate Token
      var payload = {
        user_id: user.user_id,
        role: user.role,
        exp: new Date().getTime() + (60 * 60 * 1000) // 1 hour
      };
      var token = Utils.generateToken(payload);
      return Utils.createResponse(true, 'Login successful', { token: token, user: user });
    } else {
      return Utils.createResponse(false, 'Invalid password');
    }
  },

  register: function(data) {
    // data: { email, full_name, phone, role }
    // Validation
    if (!data.email || !data.full_name || !data.phone || !data.role) {
      return Utils.createResponse(false, 'Missing required fields');
    }

    // Check if user exists
    if (Database.findUser(data.email) || Database.findUser(data.phone)) {
      return Utils.createResponse(false, 'User already exists');
    }

    // Default Password: 4 last digits of phone
    var password = data.phone.slice(-4);
    var passwordHash = Utils.hashPassword(password);

    // Generate User ID (Simple generation, could be improved)
    // Format from memory: DI.AA.BB.CC.DDD.EEEE
    // Simplified for now: unique timestamp based
    var userId = 'U' + new Date().getTime();

    var newUser = [
      userId,
      data.email,
      data.full_name,
      data.phone,
      data.role,
      'ACTIVE', // status
      passwordHash
    ];

    var success = Database.appendRow(Config.SHEET_USERS, newUser);

    if (success) {
      return Utils.createResponse(true, 'Registration successful', { user_id: userId });
    } else {
      return Utils.createResponse(false, 'Registration failed');
    }
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Auth;
}
