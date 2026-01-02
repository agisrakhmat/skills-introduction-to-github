/**
 * Security.gs
 * Menangani keamanan, hashing, dan manajemen token sesi.
 */

if (typeof require !== 'undefined') {
  var CONFIG = require('./Config.gs');
}

var Security = {

  /**
   * Menghasilkan hash SHA-256 dari string password.
   * Digunakan untuk menyimpan dan memverifikasi password.
   */
  hashPassword: function(password) {
    if (typeof Utilities === 'undefined') {
      // Mock untuk testing lokal Node.js
      var crypto = require('crypto');
      return crypto.createHash('sha256').update(password).digest('hex');
    }

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
   * Membuat Token Sederhana (HMAC-like atau Random String).
   * Untuk produksi yang lebih aman, disarankan menggunakan Library JWT.
   * Di sini kita menggunakan pendekatan sederhana: base64(userId + timestamp + random) + signature.
   */
  generateToken: function(user) {
    var payload = {
      uid: user.User_ID,
      role: user.Role,
      exp: new Date().getTime() + (24 * 60 * 60 * 1000) // Expired 24 jam
    };

    var jsonPayload = JSON.stringify(payload);
    var encodedPayload = "";

    if (typeof Utilities === 'undefined') {
        encodedPayload = Buffer.from(jsonPayload).toString('base64');
    } else {
        encodedPayload = Utilities.base64Encode(jsonPayload);
    }

    // Tanda tangan sederhana (seharusnya menggunakan secret key yang kuat)
    var signature = this.hashPassword(encodedPayload + "SECRET_KEY_DIPLOMA_ILMI");

    return encodedPayload + "." + signature;
  },

  /**
   * Memvalidasi token dan mengembalikan payload user jika valid.
   */
  validateToken: function(token) {
    if (!token) return null;

    var parts = token.split(".");
    if (parts.length !== 2) return null;

    var encodedPayload = parts[0];
    var signature = parts[1];

    // Verifikasi Signature
    var expectedSignature = this.hashPassword(encodedPayload + "SECRET_KEY_DIPLOMA_ILMI");
    if (signature !== expectedSignature) return null;

    // Decode Payload
    var jsonPayload = "";
    if (typeof Utilities === 'undefined') {
        jsonPayload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    } else {
        jsonPayload = Utilities.newBlob(Utilities.base64Decode(encodedPayload)).getDataAsString();
    }

    var payload = JSON.parse(jsonPayload);

    // Cek Expired
    if (new Date().getTime() > payload.exp) return null;

    return payload;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Security;
}
