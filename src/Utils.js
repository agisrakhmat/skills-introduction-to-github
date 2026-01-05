var Utils = {
  // Convert 08... to 62...
  normalizePhone: function(phone) {
    if (!phone) return "";
    phone = phone.toString().replace(/\D/g, ''); // Remove non-digits
    if (phone.startsWith('0')) {
      return '62' + phone.substring(1);
    }
    return phone;
  },

  // Simple Hash (GAS & Node compatible wrapper)
  hashPassword: function(password) {
    if (typeof Utilities !== 'undefined') {
      var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
      return digest.map(function(byte) {
        // Convert byte to hex
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).join('');
    } else {
      // Node.js fallback for testing
      try {
        var crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
      } catch (e) {
        return "MOCK_HASH_" + password;
      }
    }
  },

  // Generate UUID-like string
  generateId: function() {
    if (typeof Utilities !== 'undefined') {
      return Utilities.getUuid();
    } else {
       return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
};

if (typeof module !== "undefined") {
  module.exports = Utils;
}
