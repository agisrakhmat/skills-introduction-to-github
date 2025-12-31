/**
 * AuthController.gs
 * Handles Authentication and Registration.
 */

if (typeof DatabaseWrapper === 'undefined' && typeof require !== 'undefined') {
  var DatabaseWrapper = require('./DatabaseWrapper.gs');
}

var AuthController = (function() {

  /**
   * Registers a new student.
   * Auto-generates password from last 4 digits of phone.
   */
  function registerStudent(fullName, email, phone) {
    // Check if user exists
    if (DatabaseWrapper.getUserByEmail(email) || DatabaseWrapper.getUserByPhone(phone)) {
      throw new Error("User already exists.");
    }

    // Generate Password (Last 4 digits of phone)
    var rawPassword = phone.slice(-4);
    // In a real app, use Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawPassword)
    // For mock/test, we just store it raw or simple hash
    var passwordHash = "HASH_" + rawPassword;

    var newUser = {
      user_id: 'S_' + new Date().getTime(), // Simple ID generation
      email: email,
      full_name: fullName,
      phone: phone,
      role: 'STUDENT',
      status: 'ACTIVE',
      password_hash: passwordHash
    };

    DatabaseWrapper.createUser(newUser);
    return newUser;
  }

  /**
   * Authenticates a user.
   * Supports Email or Phone.
   */
  function login(identifier, password) {
    var user = null;
    if (identifier.includes('@')) {
      user = DatabaseWrapper.getUserByEmail(identifier);
    } else {
      user = DatabaseWrapper.getUserByPhone(identifier);
    }

    if (!user) {
        throw new Error("User not found.");
    }

    // Verify Password
    // In real app: compare hashes
    if (user.password_hash !== "HASH_" + password) {
       throw new Error("Invalid password.");
    }

    if (user.status !== 'ACTIVE') {
       throw new Error("Account inactive.");
    }

    return user;
  }

  return {
    registerStudent: registerStudent,
    login: login
  };

})();

if (typeof module !== 'undefined') {
  module.exports = AuthController;
}
