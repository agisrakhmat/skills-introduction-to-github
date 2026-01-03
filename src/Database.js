// src/Database.js

// Ensure Config is available
if (typeof Config === 'undefined') {
  var Config = require('./Config');
}

var Database = {
  /**
   * Helper to get a sheet by name.
   */
  _getSheet: function(sheetName) {
    if (typeof SpreadsheetApp === 'undefined') {
      throw new Error("SpreadsheetApp is not defined (running in local/test mode?)");
    }
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    return ss.getSheetByName(sheetName);
  },

  /**
   * Fetches user data by NIM and validates with Phone.
   * @param {string} nim
   * @param {string} phone
   * @returns {Object|null} User object or null if not found/invalid.
   */
  getUserByNimAndPhone: function(nim, phone) {
    // Check local mock if testing
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetUser(nim, phone);

    var sheet = this._getSheet(Config.SHEET_USER);
    if (!sheet) return null;

    var data = sheet.getDataRange().getValues();
    // Start from row 1 (skip header)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Col A: NIM, Col F: Phone
      // Convert both to string and trim for comparison
      var dbNim = String(row[0]).trim();
      var dbPhone = String(row[5]).trim();

      if (dbNim.toLowerCase() === nim.toLowerCase() && this._cleanPhone(dbPhone) === this._cleanPhone(phone)) {
        return {
          nim: dbNim,
          nama: row[1], // Col B
          jenis_kelamin: row[2], // Col C
          alamat: row[3], // Col D
          program: row[4], // Col E
          angkatan: row[6], // Col G
          tempat_lahir: row[7], // Col H
          tanggal_lahir: row[8] // Col I
        };
      }
    }
    return null;
  },

  /**
   * Cleans phone number for comparison (removes non-digits).
   * Also normalizes '08' prefix to '628'.
   */
  _cleanPhone: function(phone) {
    if (!phone) return '';
    var cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  },

  /**
   * Fetches grade for a specific course and NIM.
   * @param {string} sheetName
   * @param {string} nim
   * @returns {number|null} Score or null if not found.
   */
  getCourseGrade: function(sheetName, nim) {
    // Check local mock if testing
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetGrade(sheetName, nim);

    var sheet = this._getSheet(sheetName);
    if (!sheet) return 0; // Default to 0 if sheet missing? Or null?

    var data = sheet.getDataRange().getValues();
    // Start from row 1
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var dbNim = String(row[0]).trim(); // Key: NIM in Col A? Verify AGENTS.md.
      // AGENTS.md: "Key: NIM (Search for NIM in the sheet). Value: Nilai Akhir (Column K)"

      if (dbNim.toLowerCase() === nim.toLowerCase()) {
        // Column K is index 10 (0-based: A=0, K=10)
        var score = row[10];
        return (score === '' || score === null) ? 0 : Number(score);
      }
    }
    return 0; // Not found = 0?
  },

  /**
   * Checks if certificate exists for NIM.
   * @param {string} nim
   * @returns {Object|null} Certificate record or null.
   */
  getCertificateLog: function(nim) {
    // Check local mock if testing
    if (typeof SpreadsheetApp === 'undefined') return this._mockGetCert(nim);

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    if (!sheet) return null;

    var data = sheet.getDataRange().getValues();
    // Col B is NIM
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === nim.toLowerCase()) {
        return {
          nomor: data[i][0],
          nim: data[i][1],
          nama: data[i][2],
          timestamp: data[i][3],
          url: data[i][4]
        };
      }
    }
    return null;
  },

  /**
   * Counts how many certificates have been issued for a specific batch (Angkatan)
   * to determine the next sequence number.
   * Format: Diplim-MSTW-01-[Angkatan]-[XXXX]
   * We can filter the 'nomor' column by the angkatan part.
   */
  getNextCertificateSequence: function(angkatan) {
    if (typeof SpreadsheetApp === 'undefined') return 1;

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    if (!sheet) return 1;

    var data = sheet.getDataRange().getValues();
    var count = 0;
    var prefix = 'Diplim-MSTW-01-' + angkatan;

    for (var i = 1; i < data.length; i++) {
      var nomor = String(data[i][0]);
      if (nomor.indexOf(prefix) !== -1) {
        count++;
      }
    }
    return count + 1;
  },

  /**
   * Saves a new certificate record.
   */
  saveCertificateLog: function(nomor, nim, nama, url) {
    if (typeof SpreadsheetApp === 'undefined') {
       console.log('Mock Save Cert:', nomor, nim, nama, url);
       return;
    }

    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    if (!sheet) {
      // Create if doesn't exist? Ideally should exist.
      return;
    }

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
