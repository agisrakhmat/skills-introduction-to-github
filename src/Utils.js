// src/Utils.js

var Utils = {
  // Simple check for GAS environment
  isGas: function() {
    return typeof Utilities !== 'undefined';
  },

  // Hash password using SHA-256
  hashPassword: function(password) {
    if (this.isGas()) {
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
    } else {
      // Node.js fallback (mock or using crypto module if available)
      if (typeof require !== 'undefined') {
        try {
          var crypto = require('crypto');
          return crypto.createHash('sha256').update(password).digest('hex');
        } catch (e) {
          return 'MOCK_HASH_' + password;
        }
      }
      return 'MOCK_HASH_' + password;
    }
  },

  // Generate a simple token (mock HMAC for simplicity in this iteration, or proper HMAC if possible)
  // Real implementation should use a secret key
  generateToken: function(payload) {
    var header = { alg: "HS256", typ: "JWT" };
    var stringifiedHeader = JSON.stringify(header);
    var stringifiedPayload = JSON.stringify(payload);

    var encodedHeader = this.base64UrlEncode(stringifiedHeader);
    var encodedPayload = this.base64UrlEncode(stringifiedPayload);

    var signature = this.sign(encodedHeader + "." + encodedPayload, "SECRET_KEY");

    return encodedHeader + "." + encodedPayload + "." + signature;
  },

  base64UrlEncode: function(str) {
    if (this.isGas()) {
      var bytes = Utilities.newBlob(str).getBytes();
      return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
    } else {
      // Node.js fallback
      return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  },

  sign: function(input, key) {
    if (this.isGas()) {
      var signature = Utilities.computeHmacSha256Signature(input, key);
      return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');
    } else {
       if (typeof require !== 'undefined') {
        try {
          var crypto = require('crypto');
          return crypto.createHmac('sha256', key).update(input).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        } catch (e) {
          return 'MOCK_SIG';
        }
      }
      return 'MOCK_SIG';
    }
  },

  // Standard JSON Response
  createResponse: function(success, message, data) {
    return {
      success: success,
      message: message,
      data: data || null
    };
  },

  // Format Date for Sheets
  formatDate: function(date) {
    // Returns YYYY-MM-DD
    var d = new Date(date);
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Utils;
}
