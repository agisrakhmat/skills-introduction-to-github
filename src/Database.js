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
      // Col A: NIM, Col F: Phone
      var dbNim = row[0] ? String(row[0]).trim() : '';
      var dbPhone = row[5] ? String(row[5]).trim() : '';

      // Debugging note: In real GAS, we can't see console unless checking Executions.
      // But the logic is robust: lowercase comparison + phone normalization.
      if (dbNim.toLowerCase() === nim.toLowerCase() && this._cleanPhone(dbPhone) === this._cleanPhone(phone)) {
        return {
          nim: dbNim,
          nama: row[1], // Col B
          jenis_kelamin: row[2], // Col C
          alamat: row[3], // Col D
          program: row[4], // Col E
          phone: dbPhone,
          angkatan: row[6], // Col G
          tempat_lahir: row[7], // Col H
          tanggal_lahir: row[8] // Col I
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

    // If sheet doesn't exist, we might not want to crash the whole flow, just return 0?
    // User said sheet names are fixed. If missing, better to error out or return 0.
    // Given the task, let's try to get the sheet. If it fails (typo in config vs sheet), it throws.
    // This is good for debugging.
    var sheet = this._getSheet(sheetName);
    var data = sheet.getDataRange().getValues();

    // Start from row 1
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var dbNim = row[0] ? String(row[0]).trim() : '';

      if (dbNim.toLowerCase() === nim.toLowerCase()) {
        // Column K is index 10 (0-based: A=0, K=10)
        var score = row[10];
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
      // If certificate sheet missing, create it? Or return null (feature disabled).
      // Prompt implies it exists.
      throw e;
    }

    var data = sheet.getDataRange().getValues();
    // Col B is NIM (Index 1)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Check if row has data
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
   * Sequence is based on total existing certificates + 1.
   * Format: Diplim-MSTW-01-07-[XXXX]
   */
  getNextCertificateSequence: function() {
    if (typeof SpreadsheetApp === 'undefined') return 1;

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    // getLastRow returns the last row with content.
    // If only header (row 1), lastRow is 1. count is 0. Next is 1.
    // If header + 1 cert, lastRow is 2. count is 1. Next is 2.
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
    // Append [Nomor, NIM, Nama, Timestamp, URL]
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
