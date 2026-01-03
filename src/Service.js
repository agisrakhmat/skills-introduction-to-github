// src/Service.js

if (typeof Config === 'undefined') {
  var Config = require('./Config');
}
if (typeof Database === 'undefined') {
  var Database = require('./Database');
}

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
      // Return detailed error for debugging (User can see this in the modal)
      var cleanPhoneInput = Database._cleanPhone(phone);
      return {
        status: 'error',
        message: 'Data Tidak Ditemukan. Mohon cek kembali NIM (' + nim + ') dan Nomor Telepon (' + phone + '). Pastikan nomor terdaftar di database.'
      };
    }

    // Fetch grades for all courses
    var gradeResults = [];
    var totalScore = 0;
    var courseCount = Config.SHEET_COURSES.length;

    for (var i = 0; i < courseCount; i++) {
      var courseName = Config.SHEET_COURSES[i];
      var score = Database.getCourseGrade(courseName, nim);

      var predicate = this.getPredicate(score);
      // Status Passed if score >= 60 (Config.MIN_PASS_AVERAGE logic applied per subject?
      // User prompt says "Syarat lulusnya hasil pembagian nilai...".
      // But typically subjects also have pass/fail.
      // I'll assume standard >= 60 is Lulus (LL), else Belum Lulus (BL).
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
    // Check graduation: Average >= 60 AND (optional: no subjects < X? User only specified Average).
    // Prompt: "syarat lulusnya hasil pembagian nilai tersebut tidak boleh kurang dari 60."
    var isGraduated = (average >= Config.MIN_PASS_AVERAGE);

    // Format TTL
    var ttlStr = (user.tempat_lahir || '') + ', ' + this._formatDate(user.tanggal_lahir);

    // Certificate Logic
    var certUrl = '';

    if (isGraduated) {
      try {
        var certLog = Database.getCertificateLog(user.nim);
        if (certLog) {
          // If already exists, return existing URL
          certUrl = certLog.url;
        } else {
          // If not exists, generate new one
          if (typeof SpreadsheetApp !== 'undefined') { // Only in GAS
             certUrl = this.generateCertificate(user, average);
          } else {
             certUrl = "https://mock.url/cert.pdf"; // Mock
          }
        }
      } catch (e) {
        // If certificate generation fails, don't block the grade display.
        // Log it (console) and maybe add a warning?
        console.error('Cert Gen Error: ' + e.toString());
        // We leave certUrl empty. Frontend will disable the button + show warning.
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
   * Generates certificate PDF.
   * @returns {string} Download URL of the PDF.
   */
  generateCertificate: function(user, averageScore) {
    if (typeof DriveApp === 'undefined') return '';

    // 1. Determine Predicate based on Average
    var predicate = this.getPredicate(averageScore);

    // 2. Generate Number: Diplim-MSTW-01-07-[XXXX]
    var seq = Database.getNextCertificateSequence();
    var seqStr = ('0000' + seq).slice(-4); // Pad to 4 digits
    var certNo = 'Diplim-MSTW-01-' + Config.CERT_STATIC_CODE + '-' + seqStr;

    // 3. Copy Template
    var templateFile = DriveApp.getFileById(Config.SLIDE_TEMPLATE_ID);
    var folder = DriveApp.getFolderById(Config.DRIVE_FOLDER_ID);

    // Filename: NIM_Nama_Program
    var filename = user.nim + '_' + user.nama + '_' + user.program;

    var copyFile = templateFile.makeCopy(filename, folder);
    var copyId = copyFile.getId();

    try {
        var slideDoc = SlidesApp.openById(copyId);
        var slides = slideDoc.getSlides();
        var slide = slides[0];

        // 4. Replace Text
        // Placeholders: <<nomor sertifikat>>, <<nama>>, <<predikat>>
        slide.replaceAllText('<<nomor sertifikat>>', certNo);
        slide.replaceAllText('<<nama>>', user.nama);
        slide.replaceAllText('<<predikat>>', predicate);

        slideDoc.saveAndClose();

        // 5. Convert to PDF
        var pdfBlob = copyFile.getAs(MimeType.PDF);
        var pdfFile = folder.createFile(pdfBlob);
        pdfFile.setName(filename + '.pdf'); // Ensure PDF name

        // 6. Delete temp slide
        copyFile.setTrashed(true);

        // 7. Get Download URL
        var pdfUrl = pdfFile.getUrl();

        // 8. Save to Log
        Database.saveCertificateLog(certNo, user.nim, user.nama, pdfUrl);

        return pdfUrl;

    } catch (e) {
        // Cleanup if failed
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
    return 'Rasib'; // Default if < 60 (Fail)
  },

  _formatDate: function(dateInput) {
    if (!dateInput) return '-';
    // If it's a Date object
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

if (typeof module !== 'undefined') {
  module.exports = Service;
}
