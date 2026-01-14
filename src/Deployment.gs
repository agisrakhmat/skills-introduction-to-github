/**
 * DEPLOYMENT FILE - DIPLOMA ILMI LMS BACKEND
 *
 * INSTRUCTIONS:
 * 1. Copy ALL content of this file.
 * 2. Paste into 'Code.gs' in your Google Apps Script project.
 * 3. Save and Deploy as Web App.
 *
 * NOTE: This file bundles Config, Database, Service, and Router into one
 * to avoid "require is not defined" errors in the Apps Script environment.
 */

/* =========================================
   1. CONFIGURATION
   ========================================= */
var Config = {
  // IDs provided by the user
  SPREADSHEET_ID: '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE',
  DRIVE_FOLDER_ID: '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4',
  SLIDE_TEMPLATE_ID: '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ',

  // Sheet Names
  SHEET_USER: 'data_user',
  SHEET_CERTIFICATE: 'sertifikat',
  SHEET_COURSES: ['Aqidah', 'Dakwah', "Fiqih Syafi'i", 'Fiqih Waris', 'Nahwu'],

  // Column Indexes (0-based)
  // Data User Sheet: A=0, B=1, ...
  COL_INDEX_NIM: 0,        // Column A
  COL_INDEX_NAME: 1,       // Column B
  COL_INDEX_SEX: 2,        // Column C
  COL_INDEX_ADDRESS: 3,    // Column D
  COL_INDEX_PROGRAM: 4,    // Column E
  COL_INDEX_PHONE: 5,      // Column F
  COL_INDEX_BATCH: 6,      // Column G (Angkatan)
  COL_INDEX_BIRTHPLACE: 7, // Column H
  COL_INDEX_BIRTHDATE: 8,  // Column I

  // Course Sheets
  // NIM in Column A. 'Nilai Akhir' usually in K (10), but we use Smart Lookup.
  // 'Keterangan' is in L (11), but logic focuses on Nilai Akhir for calculation.
  HEADER_GRADE: 'Nilai Akhir', // Header name to search for
  COL_INDEX_GRADE_NIM: 0,      // Column A

  // Certificate Configuration
  CERT_PREFIX: 'Diplim-MSTW-01-',
  CERT_STATIC_CODE: '07', // Format: Prefix + StaticCode + Sequence

  // Grading Thresholds (Predikat)
  GRADE_THRESHOLDS: [
    { min: 95, predicate: 'Mumtaz' },
    { min: 85, predicate: 'Jayyid Jiddan Murtafi' },
    { min: 80, predicate: 'Jayyid Jiddan' },
    { min: 75, predicate: "Jayyid Murtafi'" },
    { min: 60, predicate: 'Jayyid' }
  ],

  // Graduation Minimum Average
  MIN_PASS_AVERAGE: 60
};

/* =========================================
   2. DATABASE (Google Sheets Interaction)
   ========================================= */
var Database = {
  /**
   * Helper to get a sheet by name with error checking.
   */
  _getSheet: function(sheetName) {
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' tidak ditemukan. Mohon cek nama tab di Spreadsheet.");
    }
    return sheet;
  },

  /**
   * Fetches user data by NIM and validates with Phone.
   */
  getUserByNimAndPhone: function(nim, phone) {
    var sheet = this._getSheet(Config.SHEET_USER);
    // Get all data (A:I) to cover all fields
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
   * Cleans phone number for comparison (08 -> 62).
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
   * Uses "Smart Lookup" to find the column with header "Nilai Akhir".
   */
  getCourseGrade: function(sheetName, nim) {
    // Force recalculation of formulas to ensure fresh data
    SpreadsheetApp.flush();

    var sheet = this._getSheet(sheetName);
    var data = sheet.getDataRange().getValues();

    if (data.length === 0) return 0;

    // 1. Find the Grade Column Index by Header Name
    var headers = data[0]; // Row 0 is header
    var gradeColIndex = -1;

    // Normalize target: remove all spaces, lowercase
    var targetHeader = (Config.HEADER_GRADE || 'Nilai Akhir').replace(/\s/g, '').toLowerCase();

    for (var j = 0; j < headers.length; j++) {
      var headerClean = String(headers[j]).replace(/\s/g, '').toLowerCase();
      if (headerClean === targetHeader) {
        gradeColIndex = j;
        break;
      }
    }

    // Fallback: If header not found, use default Column K (Index 10)
    // Note: User mentioned Keterangan is in L (Index 11), so K (Index 10) for Grade is consistent.
    if (gradeColIndex === -1) {
       gradeColIndex = 10;
    }

    // 2. Iterate rows to find NIM
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var dbNim = row[Config.COL_INDEX_GRADE_NIM] ? String(row[Config.COL_INDEX_GRADE_NIM]).trim() : '';

      if (dbNim.toLowerCase() === nim.toLowerCase()) {
        // Ensure we don't read out of bounds if row is short
        if (gradeColIndex >= row.length) return 0;

        var score = row[gradeColIndex];
        // Handle empty or string scores
        if (score === '' || score === null) return 0;
        return Number(score) || 0;
      }
    }
    return 0;
  },

  /**
   * Checks if certificate exists for NIM in 'sertifikat' sheet.
   */
  getCertificateLog: function(nim) {
    try {
      var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    } catch (e) {
      // If sheet doesn't exist, we can't get log
      return null;
    }

    var data = sheet.getDataRange().getValues();
    // Col B is NIM (Index 1)
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
    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    var timestamp = new Date();
    sheet.appendRow([nomor, nim, nama, timestamp, url]);
  }
};

/* =========================================
   3. SERVICE (Business Logic)
   ========================================= */
var Service = {
  /**
   * Main logic to process grade request.
   */
  processGrades: function(nim, phone) {
    if (!nim || !phone) {
      return { status: 'error', message: 'NIM dan Nomor Telepon wajib diisi.' };
    }

    var user = Database.getUserByNimAndPhone(nim, phone);

    if (!user) {
      return {
        status: 'error',
        message: 'Data Tidak Ditemukan. Mohon cek kembali NIM (' + nim + ') dan Nomor Telepon (' + phone + '). Pastikan nomor terdaftar di database.'
      };
    }

    // Fetch grades
    var gradeResults = [];
    var totalScore = 0;
    var courseCount = Config.SHEET_COURSES.length;

    for (var i = 0; i < courseCount; i++) {
      var courseName = Config.SHEET_COURSES[i];
      var score = Database.getCourseGrade(courseName, nim);

      var predicate = this.getPredicate(score);
      // Status Passed if score >= 60
      var status = (score >= 60) ? 'LL' : 'BL';

      gradeResults.push({
        no: i + 1,
        nama: courseName,
        nilai: predicate,
        mutu: score,
        status: status
      });

      totalScore += score;
    }

    var average = (courseCount > 0) ? (totalScore / courseCount) : 0;

    // Check graduation
    var isGraduated = (average >= Config.MIN_PASS_AVERAGE);

    // Format TTL
    var ttlStr = (user.tempat_lahir || '') + ', ' + this._formatDate(user.tanggal_lahir);

    // Certificate Logic
    var certUrl = '';

    if (isGraduated) {
      try {
        var certLog = Database.getCertificateLog(user.nim);
        if (certLog) {
          certUrl = certLog.url;
        } else {
          certUrl = this.generateCertificate(user, average);
        }
      } catch (e) {
        // Log error but don't fail the whole request
        // certUrl remains empty
        Logger.log('Certificate Generation Error: ' + e.toString());
      }
    }

    return {
      status: 'success',
      data: {
        nim: user.nim,
        nama: user.nama,
        program_pembelajaran: user.program,
        angkatan: user.angkatan,
        alamat: user.alamat,
        ttl: ttlStr,
        status_kelulusan: isGraduated,
        sertifikat_url: certUrl,
        nilai: gradeResults
      }
    };
  },

  /**
   * Generates certificate PDF using Google Slides.
   */
  generateCertificate: function(user, averageScore) {
    // 1. Determine Predicate
    var predicate = this.getPredicate(averageScore);

    // 2. Generate Number
    var seq = Database.getNextCertificateSequence();
    var seqStr = ('0000' + seq).slice(-4);
    var certNo = Config.CERT_PREFIX + Config.CERT_STATIC_CODE + '-' + seqStr;

    // 3. Copy Template
    var templateFile = DriveApp.getFileById(Config.SLIDE_TEMPLATE_ID);
    var folder = DriveApp.getFolderById(Config.DRIVE_FOLDER_ID);

    var filename = user.nim + '_' + user.nama + '_' + user.program;

    var copyFile = templateFile.makeCopy(filename, folder);
    var copyId = copyFile.getId();

    try {
        var slideDoc = SlidesApp.openById(copyId);
        var slides = slideDoc.getSlides();
        var slide = slides[0];

        // 4. Replace Text
        slide.replaceAllText('<<nomor sertifikat>>', certNo);
        slide.replaceAllText('<<nama>>', user.nama);
        slide.replaceAllText('<<predikat>>', predicate);

        slideDoc.saveAndClose();

        // 5. Convert to PDF
        var pdfBlob = copyFile.getAs(MimeType.PDF);
        var pdfFile = folder.createFile(pdfBlob);
        pdfFile.setName(filename + '.pdf');

        // 6. Delete temp slide
        copyFile.setTrashed(true);

        // 7. Get Download URL
        var pdfUrl = pdfFile.getUrl();

        // 8. Save to Log
        Database.saveCertificateLog(certNo, user.nim, user.nama, pdfUrl);

        return pdfUrl;

    } catch (e) {
        copyFile.setTrashed(true);
        throw e;
    }
  },

  getPredicate: function(score) {
    for (var i = 0; i < Config.GRADE_THRESHOLDS.length; i++) {
      if (score >= Config.GRADE_THRESHOLDS[i].min) {
        return Config.GRADE_THRESHOLDS[i].predicate;
      }
    }
    return 'Rasib';
  },

  _formatDate: function(dateInput) {
    if (!dateInput) return '-';
    if (Object.prototype.toString.call(dateInput) === '[object Date]') {
      var d = dateInput;
      var day = ('0' + d.getDate()).slice(-2);
      var month = ('0' + (d.getMonth() + 1)).slice(-2);
      var year = d.getFullYear();
      return day + '/' + month + '/' + year;
    }
    return String(dateInput);
  }
};

/* =========================================
   4. ROUTER (doGet)
   ========================================= */
function doGet(e) {
  var output = {};

  try {
    if (!e || !e.parameter) {
        throw new Error("Invalid request parameters.");
    }

    var nim = e.parameter.nim;
    var phone = e.parameter.phone;

    output = Service.processGrades(nim, phone);

  } catch (err) {
    output = {
      status: 'error',
      message: 'Terjadi kesalahan server: ' + err.toString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
