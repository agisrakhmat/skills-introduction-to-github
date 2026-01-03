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
      return { status: 'error', message: 'Maaf NIM atau Nomor telepon tidak terdaftar.' };
    }

    // Fetch grades for all courses
    var gradeResults = [];
    var totalScore = 0;
    var courseCount = Config.SHEET_COURSES.length;

    for (var i = 0; i < courseCount; i++) {
      var courseName = Config.SHEET_COURSES[i];
      var score = Database.getCourseGrade(courseName, nim);

      var predicate = this.getPredicate(score);

      // Implicit subject status: passed if >= 60?
      // User didn't specify per-subject fail condition explicitly for the table,
      // but "syarat lulusnya hasil pembagian nilai tersebut tidak boleh kurang dari 60".
      // Usually subject status is also based on score.
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
    var isGraduated = (average >= Config.MIN_PASS_AVERAGE);

    // Format TTL
    var ttlStr = (user.tempat_lahir || '') + ', ' + this._formatDate(user.tanggal_lahir);
    // If tanggal_lahir is Date object (from Sheet), format it. If string, leave it.

    // Check certificate
    var certUrl = '';
    var certLog = Database.getCertificateLog(nim);

    // If graduated and cert exists, use it.
    // If graduated and not exists, it will be generated when user clicks "Cetak Sertifikat" (different endpoint/action?)
    // Wait, user flow: "Jika sertifikat di proses maka user dapat mendowloadnya... jika user melakukan request untuk ke 2 kalinya... backend tidak akan membuat ulang".
    // The frontend has a "Cetak Sertifikat" button (Link).
    // The frontend logic: `if(isGraduated && data.sertifikat_url)`.
    // This implies `data.sertifikat_url` should be populated if available.
    // Does the "Cek Data" action generate the certificate automatically?
    // User said: "anda akan memastikan menyimpan data terkait sertifikat ini pada sheet sertifikat... Jika sertifikat di proses maka user dapat mendowloadnya"
    // And "Jika sertifikat di proses maka user dapat mendowloadnya, di sisi back end akan mengarsipkan PDF nya juga... lalu jika user melakukan request untuk ke 2 kalinya... backend tidak akan membuat ulang".

    // Interpretation: "Cek Data" just displays grades. "Cetak Sertifikat" might be a separate link.
    // BUT the frontend button `id="sp-dl-sertifikat"` is an `<a>` tag: `<a href="#" ... target="_blank">`.
    // If I return the URL in the JSON response, the frontend sets the href.
    // If the URL is empty/null, the frontend disables the button.
    // So, I should probably generate the certificate *on the fly* during `processGrades` if they are graduated?
    // OR, provide a separate endpoint to generate it?
    // Frontend code: `const finalUrl = ... fetch(finalUrl)`.
    // It only calls ONE endpoint.
    // So, `processGrades` MUST generate the certificate if the student is graduated and one doesn't exist yet?
    // OR, maybe the user wants it generated only when requested?
    // The frontend button is a direct link to the PDF (`href`).
    // This implies the PDF must exist (or the link is a GAS endpoint that serves PDF).
    // Given the "User Slide Template -> PDF" workflow, it's expensive to generate.
    // If I generate it on every "Cek Data", it might be slow.
    // However, since the frontend expects a `sertifikat_url` immediately in the JSON response to enable the button,
    // AND the button is an `<a>` tag to the PDF (not a button triggering another JS function),
    // I MUST provide the PDF URL in the response.
    // THEREFORE: I must generate the certificate during `processGrades` if it doesn't exist and the student passed.

    if (isGraduated) {
      if (certLog) {
        certUrl = certLog.url;
      } else {
        // Generate new certificate
        // Note: In real GAS execution, this calls DriveApp/SlidesApp.
        // In local test, this will be mocked.
        if (typeof SpreadsheetApp !== 'undefined') {
            certUrl = this.generateCertificate(user, average);
        } else {
            certUrl = "https://mock.url/cert.pdf"; // Mock for local test
        }
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
    if (typeof DriveApp === 'undefined') return ''; // Safety

    try {
      // 1. Determine Predicate
      var predicate = this.getPredicate(averageScore);

      // 2. Generate Number
      var seq = Database.getNextCertificateSequence(user.angkatan);
      var seqStr = ('0000' + seq).slice(-4); // Pad to 4 digits
      var certNo = 'Diplim-MSTW-01-' + user.angkatan + '-' + seqStr;

      // 3. Copy Template
      var templateFile = DriveApp.getFileById(Config.SLIDE_TEMPLATE_ID);
      var folder = DriveApp.getFolderById(Config.DRIVE_FOLDER_ID);
      // Filename: NIM_Nama_Jurusan
      var filename = user.nim + '_' + user.nama + '_' + user.program;

      var copyFile = templateFile.makeCopy(filename, folder);
      var copyId = copyFile.getId();
      var slideDoc = SlidesApp.openById(copyId);
      var slides = slideDoc.getSlides();
      var slide = slides[0]; // Assume single slide

      // 4. Replace Text
      // <<nomor sertifikat>>, <<nama>>, <<predikat>>
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
      // Use getUrl() or getDownloadUrl(). getUrl() is view link (preview), usually better for users to "print".
      var pdfUrl = pdfFile.getUrl(); // or .getDownloadUrl()

      // 8. Save to Log
      Database.saveCertificateLog(certNo, user.nim, user.nama, pdfUrl);

      return pdfUrl;

    } catch (e) {
      console.error('Error generating certificate: ' + e.toString());
      // If error, maybe return empty string so user can try again later?
      return '';
    }
  },

  getPredicate: function(score) {
    for (var i = 0; i < Config.GRADE_THRESHOLDS.length; i++) {
      if (score >= Config.GRADE_THRESHOLDS[i].min) {
        return Config.GRADE_THRESHOLDS[i].predicate;
      }
    }
    return 'Rasib'; // Fail
  },

  _formatDate: function(dateInput) {
    if (!dateInput) return '';
    if (dateInput instanceof Date) {
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
