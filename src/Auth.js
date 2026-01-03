var Auth = {
  // In production, fetch this from PropertiesService.getScriptProperties().getProperty('JWT_SECRET')
  SECRET: 'diploma-ilmi-secret-key-change-this-in-production',

  /**
   * Hashes a password using SHA-256.
   * @param {string} password
   * @return {string} Hex string of the hash.
   */
  hashPassword: function(password) {
    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
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
  },

  /**
   * Authenticates a user.
   * @param {Object} params - { login, password }
   * @return {TextOutput}
   */
  login: function(params) {
    var login = params.login;
    var password = params.password;

    if (!login || !password) {
      return Utils.createErrorResponse('Login and password are required', 400);
    }

    var user = Users.findByLogin(login);
    if (!user) {
      return Utils.createErrorResponse('Invalid credentials', 401);
    }

    var inputHash = this.hashPassword(password);
    if (inputHash !== user.password_hash) {
      return Utils.createErrorResponse('Invalid credentials', 401);
    }

    var token = this.generateToken(user);

    return Utils.createSuccessResponse({
      token: token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }
    }, 'Login successful');
  },

  /**
   * Registers a new student.
   * @param {Object} params - { email, phone, full_name, gender }
   * @return {TextOutput}
   */
  register: function(params) {
    var email = params.email;
    var phone = params.phone;
    var fullName = params.full_name;
    var gender = params.gender; // Required for ID generation

    if (!email || !phone || !fullName || !gender) {
      return Utils.createErrorResponse('Missing required fields: email, phone, full_name, gender', 400);
    }

    // Check duplicates
    if (Users.findByLogin(email) || Users.findByLogin(phone)) {
      return Utils.createErrorResponse('User with this email or phone already exists', 409);
    }

    var newUser = {
      email: email,
      phone: phone,
      full_name: fullName,
      gender: gender,
      role: Config.ROLES.STUDENT
    };

    var createdUser = Users.createUser(newUser);

    // Auto-login: Generate token
    // We need to ensure the user object passed to generateToken has the necessary fields
    // createUser returns { user_id, email, role } which is enough for generateToken
    var token = this.generateToken(createdUser);

    return Utils.createSuccessResponse({
      token: token,
      user: createdUser
    }, 'Registration successful');
  },

  /**
   * Generates a JWT-like token.
   * @param {Object} user
   * @return {string}
   */
  generateToken: function(user) {
    var header = { alg: 'HS256', typ: 'JWT' };
    var now = new Date().getTime();
    var payload = {
      sub: user.user_id,
      role: user.role,
      iat: now,
      exp: now + (24 * 60 * 60 * 1000) // 24 hours
    };

    var encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
    var encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
    var toSign = encodedHeader + '.' + encodedPayload;

    var signature = Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256,
      toSign,
      this.SECRET
    );
    var encodedSignature = Utilities.base64EncodeWebSafe(signature);

    return toSign + '.' + encodedSignature;
  },

  /**
   * Verifies a token.
   * @param {string} token
   * @return {Object|null} Payload if valid, null otherwise.
   */
  verifyToken: function(token) {
    if (!token) return null;

    var parts = token.split('.');
    if (parts.length !== 3) return null;

    var toSign = parts[0] + '.' + parts[1];
    var signature = parts[2];

    var checkSignature = Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256,
      toSign,
      this.SECRET
    );
    var encodedCheckSignature = Utilities.base64EncodeWebSafe(checkSignature);

    if (signature !== encodedCheckSignature) {
      return null;
    }

    var jsonPayload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
    var payload = JSON.parse(jsonPayload);

    if (payload.exp < new Date().getTime()) {
      return null; // Expired
    }

    return payload;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
