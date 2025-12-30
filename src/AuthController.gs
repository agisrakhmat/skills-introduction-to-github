/**
 * AuthController.gs
 * Handles User Authentication and Registration.
 */

var SECRET_KEY = 'DIPLOMA_ILMI_SECRET_KEY'; // In production, use PropertiesService

var AuthController = {

  /**
   * Registers a new student.
   * @param {Object} data { email, full_name, phone, gender, year, batch }
   */
  register: function(data) {
    try {
      // Validate inputs
      if (!data.email || !data.full_name || !data.phone) {
        return { status: 'error', message: 'Missing required fields' };
      }

      // Check if user exists (by email or phone)
      var existingEmail = findRow(TABLES.USERS, 'email', data.email);
      if (existingEmail) return { status: 'error', message: 'Email already registered' };

      var existingPhone = findRow(TABLES.USERS, 'phone', data.phone);
      if (existingPhone) return { status: 'error', message: 'Phone already registered' };

      // Generate NIM (ID)
      var genderCode = data.gender === 'FEMALE' ? 'AT' : 'IN';
      var yearCode = data.year || new Date().getFullYear().toString().substr(-2);
      var batchCode = data.batch || '01';
      var statusCode = 'RGR';

      var prefix = 'DI.' + genderCode + '.' + yearCode + '.' + batchCode + '.' + statusCode;
      var nextSequence = this._getNextSequence(prefix);
      var userId = prefix + '.' + nextSequence;

      // Default Password: Last 4 digits of phone
      var rawPassword = data.phone.substr(-4);
      var passwordHash = this._hashPassword(rawPassword);

      var newUser = {
        user_id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: 'STUDENT',
        status: 'ACTIVE',
        password_hash: passwordHash
      };

      appendRow(TABLES.USERS, newUser);

      return {
        status: 'success',
        message: 'Registration successful',
        data: {
          user_id: userId,
          password: rawPassword // Return plain password once for user to see
        }
      };

    } catch (e) {
      return { status: 'error', message: e.toString() };
    }
  },

  /**
   * Logs in a user.
   * @param {Object} data { identifier, password }
   */
  login: function(data) {
    var identifier = data.identifier;
    var password = data.password;

    var user = findRow(TABLES.USERS, 'email', identifier) ||
               findRow(TABLES.USERS, 'phone', identifier) ||
               findRow(TABLES.USERS, 'user_id', identifier);

    if (!user) {
      return { status: 'error', message: 'User not found' };
    }

    // Verify Password Hash
    if (this._hashPassword(password) === user.password_hash) {
       var timestamp = new Date().getTime();
       var payload = user.user_id + ':' + timestamp;
       var signature = Utilities.computeHmacSha256Signature(payload, SECRET_KEY);
       var signatureStr = Utilities.base64Encode(signature);
       var token = Utilities.base64Encode(payload) + '.' + signatureStr;

       return {
         status: 'success',
         message: 'Login successful',
         data: {
           token: token,
           user: {
             user_id: user.user_id,
             full_name: user.full_name,
             role: user.role,
             status: user.status
           }
         }
       };
    } else {
      return { status: 'error', message: 'Invalid password' };
    }
  },

  /**
   * Validates a token.
   * Format: base64(userId:timestamp).base64(signature)
   */
  validateToken: function(token) {
      if (!token) return null;
      try {
          var parts = token.split('.');
          if (parts.length !== 2) return null;

          var payloadEncoded = parts[0];
          var signatureEncoded = parts[1];

          var decodedPayload = Utilities.newBlob(Utilities.base64Decode(payloadEncoded)).getDataAsString();

          // Verify Signature
          var expectedSignature = Utilities.computeHmacSha256Signature(decodedPayload, SECRET_KEY);
          var expectedSignatureStr = Utilities.base64Encode(expectedSignature);

          if (signatureEncoded !== expectedSignatureStr) {
              return null; // Forged token
          }

          var payloadParts = decodedPayload.split(':');
          var userId = payloadParts[0];
          var timestamp = parseInt(payloadParts[1]);

          // Check expiration (24 hours)
          var now = new Date().getTime();
          if (now - timestamp > 24 * 60 * 60 * 1000) {
              return null;
          }

          // Verify user exists and is active
          var user = findRow(TABLES.USERS, 'user_id', userId);
          if (!user || user.status !== 'ACTIVE') return null;

          return user;
      } catch (e) {
          return null;
      }
  },

  _hashPassword: function(password) {
      // Simple SHA-256 hash
      var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
      var txtHash = '';
      for (var i = 0; i < rawHash.length; i++) {
          var hashVal = rawHash[i];
          if (hashVal < 0) hashVal += 256;
          if (hashVal.toString(16).length == 1) txtHash += '0';
          txtHash += hashVal.toString(16);
      }
      return txtHash;
  },

  getUserProfile: function(userId) {
      var user = findRow(TABLES.USERS, 'user_id', userId);
      if (!user) return { status: 'error', message: 'User not found' };

      // Don't return password
      delete user.password_hash;
      return { status: 'success', data: user };
  },

  /**
   * Helper to generate sequence number.
   * Checks DB for last ID with same prefix.
   */
  _getNextSequence: function(prefix) {
    var users = readTable(TABLES.USERS);
    var maxSeq = 0;

    users.forEach(function(u) {
      if (u.user_id && u.user_id.indexOf(prefix) === 0) {
        var parts = u.user_id.split('.');
        var seq = parseInt(parts[parts.length - 1]);
        if (seq > maxSeq) maxSeq = seq;
      }
    });

    var next = maxSeq + 1;
    // Pad to 4 digits
    return ('0000' + next).slice(-4);
  }
};
