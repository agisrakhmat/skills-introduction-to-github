// src/Database.js

if (typeof Config === 'undefined') {
  var Config = require('./Config');
}

var Database = {
  /**
   * Helper to get a sheet by name with error checking.
   */
  _getSheet: function(sheetName) {
    if (typeof SpreadsheetApp === 'undefined') {
      throw new Error("SpreadsheetApp is not defined (running in local/test mode?)");
    }
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' tidak ditemukan. Mohon cek nama tab di Spreadsheet.");
    }
    return sheet;
  },

  /**
   * Fetches user data by NIM and validates with Phone.
   * @param {string} nim
   * @param {string} phone
   * @returns {Object|null} User object or null if not found.
   */
  getUserByNimAndPhone: function(nim, phone) {
    // Check local mock if testing
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetUser(nim, phone);

    var sheet = this._getSheet(Config.SHEET_USER);
    var data = sheet.getDataRange().getValues();

    // Start from row 1 (skip header)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Use Configured Indexes
      var dbNim = row[Config.COL_INDEX_NIM] ? String(row[Config.COL_INDEX_NIM]).trim() : '';
      var dbPhone = row[Config.COL_INDEX_PHONE] ? String(row[Config.COL_INDEX_PHONE]).trim() : '';

      if (dbNim.toLowerCase() === nim.toLowerCase() && this._cleanPhone(dbPhone) === this._cleanPhone(phone)) {
        return {
          nim: dbNim,
          nama: row[Config.COL_INDEX_NAME],
          jenis_kelamin: row[Config.COL_INDEX_SEX],
          alamat: row[Config.COL_INDEX_ADDRESS],
          program: row[Config.COL_INDEX_PROGRAM],
          phone: dbPhone,
          angkatan: row[Config.COL_INDEX_BATCH],
          tempat_lahir: row[Config.COL_INDEX_BIRTHPLACE],
          tanggal_lahir: row[Config.COL_INDEX_BIRTHDATE]
        };
      }
    }
    return null;
  },

  /**
   * Cleans phone number for comparison.
   * - Removes non-digits.
   * - Converts '08...' to '628...'.
   * - Keeps '62...' as is.
   */
  _cleanPhone: function(phone) {
    if (!phone) return '';
    var cleaned = String(phone).replace(/\D/g, ''); // Remove all non-digits
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  },

  /**
   * Fetches grade for a specific course and NIM.
   * @param {string} sheetName
   * @param {string} nim
   * @returns {number} Score (defaults to 0 if not found).
   */
  getCourseGrade: function(sheetName, nim) {
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetGrade(sheetName, nim);

    var sheet = this._getSheet(sheetName);
    var data = sheet.getDataRange().getValues();

    // Start from row 1
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Use Configured Indexes
      var dbNim = row[Config.COL_INDEX_GRADE_NIM] ? String(row[Config.COL_INDEX_GRADE_NIM]).trim() : '';

      if (dbNim.toLowerCase() === nim.toLowerCase()) {
        var score = row[Config.COL_INDEX_GRADE_FINAL];
        // Handle empty or string scores
        if (score === '' || score === null) return 0;
        return Number(score) || 0;
      }
    }
    return 0;
  },

  /**
   * Checks if certificate exists for NIM.
   * @param {string} nim
   * @returns {Object|null} Certificate record or null.
   */
  getCertificateLog: function(nim) {
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetCert(nim);

    try {
      var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    } catch (e) {
      throw e;
    }

    var data = sheet.getDataRange().getValues();
    // Col B is NIM (Index 1). This is internal schema, can stay hardcoded or also moved to Config if super generic.
    // For now, keeping cert log schema simple/fixed is fine.
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row.length > 1 && String(row[1]).toLowerCase() === nim.toLowerCase()) {
        return {
          nomor: row[0],
          nim: row[1],
          nama: row[2],
          timestamp: row[3],
          url: row[4]
        };
      }
    }
    return null;
  },

  /**
   * Gets the next sequence number for certificates.
   */
  getNextCertificateSequence: function() {
    if (typeof SpreadsheetApp === 'undefined') return 1;

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    var lastRow = sheet.getLastRow();
    var count = lastRow - 1; // Minus header
    if (count < 0) count = 0;

    return count + 1;
  },

  /**
   * Saves a new certificate record.
   */
  saveCertificateLog: function(nomor, nim, nama, url) {
    if (typeof SpreadsheetApp === 'undefined') {
       console.log('Mock Save Cert:', nomor, nim, nama, url);
       this._mockCerts.push({nomor: nomor, nim: nim, nama: nama, url: url});
       return;
    }

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    var timestamp = new Date();
    sheet.appendRow([nomor, nim, nama, timestamp, url]);
  },

  // --- MOCKS FOR TESTING ---
  _mockDataUser: [],
  _mockGrades: {},
  _mockCerts: [],

  _mockGetUser: function(nim, phone) {
    return this._mockDataUser.find(u =>
      u.nim.toLowerCase() === nim.toLowerCase() &&
      this._cleanPhone(u.phone) === this._cleanPhone(phone)
    ) || null;
  },
  _mockGetGrade: function(sheet, nim) {
    if (this._mockGrades[sheet] && this._mockGrades[sheet][nim] !== undefined) {
        return this._mockGrades[sheet][nim];
    }
    return 0;
  },
  _mockGetCert: function(nim) {
      return this._mockCerts.find(c => c.nim.toLowerCase() === nim.toLowerCase()) || null;
  }
};

if (typeof module !== 'undefined') {
  module.exports = Database;
}
