/**
 * Code.gs
 * Backend untuk Widget Cek Nilai & Sertifikat Diploma Ilmi
 */

// --- KONFIGURASI ---
var CONF = {
  SPREADSHEET_ID: '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE',
  DRIVE_FOLDER_ID: '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4',
  SLIDE_TEMPLATE_ID: '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ',
  SHEET_NAME_USER: 'data_user',
  SHEET_NAME_SERTIFIKAT: 'Sertifikat',
  // Daftar Mata Kuliah (Menggunakan nama yang mungkin memiliki spasi)
  COURSES: ['Aqidah', 'Dakwah', 'Fiqh Syafii', 'Fiqh Waris', 'Nahwu']
};

/**
 * Fungsi Utama: Menangani Request GET dari Widget
 * Parameter: ?nim=...&phone=...
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var nim = params.nim;
  var phone = params.phone;

  // Header agar bisa diakses dari domain mana saja (CORS)
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  if (!nim || !phone) {
    return output.setContent(JSON.stringify({
      status: 'error',
      message: 'Parameter NIM dan Nomor Telepon wajib diisi. Jika anda menjalankan script ini manual, gunakan fungsi testManual().'
    }));
  }

  try {
    var result = processStudentRequest(nim, phone);
    return output.setContent(JSON.stringify(result));
  } catch (err) {
    return output.setContent(JSON.stringify({
      status: 'error',
      message: 'Terjadi kesalahan sistem: ' + err.toString()
    }));
  }
}

/**
 * FUNGSI TESTING MANUAL
 */
function testManual() {
  var mockEvent = {
    parameter: {
      nim: 'DI.AT.25.07.RGR.0000',
      phone: '628123456789'
    }
  };
  var result = doGet(mockEvent);
  Logger.log(result.getContent());
}

/**
 * Logika Utama Pemrosesan Data
 */
function processStudentRequest(nimInput, phoneInput) {
  var ss = SpreadsheetApp.openById(CONF.SPREADSHEET_ID);

  // 1. Cari Data Mahasiswa
  var student = findStudent(ss, nimInput, phoneInput);
  if (!student) {
    return {
      status: 'error',
      message: 'Maaf NIM atau Nomor telepon tidak terdaftar, mohon cek kembali data anda.'
    };
  }

  // 2. Ambil Nilai Mata Kuliah (Sekarang dengan Smart Header Detection)
  var gradeData = getStudentGrades(ss, student.nim, CONF.COURSES);

  // 3. Hitung Rata-Rata & Kelulusan
  var averageScore = gradeData.totalScore / (gradeData.courseCount || 1);
  var isGraduated = averageScore >= 60;
  var finalPredicate = getPredicate(averageScore);

  // 4. Cek / Generate Sertifikat
  var certUrl = '';
  if (isGraduated) {
    certUrl = handleCertificate(ss, student, finalPredicate);
  }

  // 5. Format Respon JSON sesuai Frontend
  return {
    status: 'success',
    data: {
      nim: student.nim,
      nama: student.nama,
      program_pembelajaran: student.program,
      angkatan: student.angkatan,
      alamat: student.alamat,
      ttl: student.tempat_lahir + ', ' + formatDate(student.tanggal_lahir),
      status_kelulusan: isGraduated,
      sertifikat_url: certUrl,
      nilai: gradeData.details
    },
    meta: {
      debug_trace: gradeData.debug // Info debug untuk user/developer
    }
  };
}

/**
 * Mencari Mahasiswa di Sheet 'data_user'
 */
function findStudent(ss, nimInput, phoneInput) {
  var sheet = ss.getSheetByName(CONF.SHEET_NAME_USER);
  if (!sheet) throw new Error("Sheet '" + CONF.SHEET_NAME_USER + "' tidak ditemukan.");

  var data = sheet.getDataRange().getDisplayValues();

  var cleanNimInput = nimInput.trim().toUpperCase();
  var cleanPhoneInput = normalizePhone(phoneInput);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dbNim = String(row[0]).trim().toUpperCase();
    var dbPhone = normalizePhone(String(row[5]));

    if (dbNim === cleanNimInput && dbPhone === cleanPhoneInput) {
      return {
        nim: dbNim,
        nama: row[1],
        jenis_kelamin: row[2],
        alamat: row[3],
        program: row[4],
        angkatan: row[6],
        tempat_lahir: row[7],
        tanggal_lahir: row[8]
      };
    }
  }
  return null;
}

/**
 * Mengambil Nilai dari setiap Sheet Mata Kuliah
 * UPDATED: Mencari nama sheet fleksibel (spasi/underscore) & mencari kolom nilai dinamis
 */
function getStudentGrades(ss, nim, courses) {
  var details = [];
  var totalScore = 0;
  var courseCount = 0;
  var debugLogs = [];

  courses.forEach(function(courseName, index) {
    // 1. Coba Cari Sheet (Cek variasi underscore/spasi)
    var sheet = ss.getSheetByName(courseName);
    var usedName = courseName;

    if (!sheet) {
      // Coba ganti Spasi <-> Underscore
      var altName = courseName.indexOf('_') > -1 ? courseName.replace(/_/g, ' ') : courseName.replace(/ /g, '_');
      sheet = ss.getSheetByName(altName);
      if (sheet) usedName = altName;
    }

    if (!sheet) {
      debugLogs.push("Sheet Not Found: " + courseName);
      return;
    }

    // 2. Tentukan Index Kolom "Nilai Akhir" secara Dinamis
    // Ambil Header (Baris 1)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var scoreColIndex = -1; // Default -1 (Not found)

    // Cari header yang mengandung kata kunci
    for (var h = 0; h < headers.length; h++) {
      var headerText = String(headers[h]).toLowerCase();
      // Prioritas: "nilai akhir", "nilai_akhir", "total", "score", "na"
      // Hindari "rata", "avg" jika bukan yang dimaksud user
      if (headerText.includes("nilai akhir") || headerText.includes("nilai_akhir") || headerText === "na") {
        scoreColIndex = h;
        break;
      }
    }

    // Fallback ke Index 10 (Kolom K) jika tidak ketemu header yang pas, tapi beresiko
    if (scoreColIndex === -1) {
       scoreColIndex = 10;
       debugLogs.push(usedName + ": Header 'Nilai Akhir' not found, using default Col K (Index 10)");
    } else {
       debugLogs.push(usedName + ": Found Header '" + headers[scoreColIndex] + "' at Index " + scoreColIndex);
    }

    // 3. Ambil Data
    var data = sheet.getDataRange().getValues();

    var score = 0;
    var found = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === nim) {
        // Ambil nilai dari kolom yang ditentukan
        var rawVal = data[i][scoreColIndex];
        // Pastikan angka valid
        score = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
        if (isNaN(score)) score = 0;

        found = true;
        break;
      }
    }

    if (found) {
      totalScore += score;
      courseCount++;

      var mutu = getPredicate(score);
      var status = score >= 60 ? 'LL' : 'BL';

      details.push({
        no: courseCount,
        nama: usedName.replace(/_/g, " "),
        nilai: mutu,
        mutu: score,
        status: status
      });
    } else {
      debugLogs.push(usedName + ": NIM not found in sheet");
    }
  });

  return {
    details: details,
    totalScore: totalScore,
    courseCount: courseCount,
    debug: debugLogs
  };
}

/**
 * Menghandle Logika Sertifikat
 */
function handleCertificate(ss, student, predikat) {
  var sheetCert = ss.getSheetByName(CONF.SHEET_NAME_SERTIFIKAT);
  if (!sheetCert) return ""; // Fail safe

  var data = sheetCert.getDataRange().getDisplayValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toUpperCase() === String(student.nama).trim().toUpperCase()) {
      return data[i][4];
    }
  }

  return generateNewCertificate(ss, sheetCert, student, predikat);
}

/**
 * Generate PDF Baru
 */
function generateNewCertificate(ss, sheetCert, student, predikat) {
  var sequence = getNextSequence(sheetCert, student.angkatan);
  var certNumber = 'Diplim-MSTW-01-' + student.angkatan + '-' + sequence;
  var fileName = student.nim + '_' + student.nama + '_' + student.program;

  var templateFile = DriveApp.getFileById(CONF.SLIDE_TEMPLATE_ID);
  var targetFolder = DriveApp.getFolderById(CONF.DRIVE_FOLDER_ID);
  var copyFile = templateFile.makeCopy(fileName, targetFolder);
  var copyId = copyFile.getId();

  var pres = SlidesApp.openById(copyId);
  var slide = pres.getSlides()[0];

  slide.replaceAllText('<<nama>>', student.nama);
  slide.replaceAllText('<<nomor sertifikat>>', certNumber);
  slide.replaceAllText('<<predikat>>', predikat);

  pres.saveAndClose();

  var pdfBlob = copyFile.getAs(MimeType.PDF);
  var pdfFile = targetFolder.createFile(pdfBlob);
  var pdfUrl = pdfFile.getUrl();

  copyFile.setTrashed(true);

  sheetCert.appendRow([
    certNumber,
    student.nama,
    predikat,
    new Date(),
    pdfUrl
  ]);

  return pdfUrl;
}

/**
 * Menghitung Sequence Number
 */
function getNextSequence(sheetCert, angkatan) {
  var data = sheetCert.getDataRange().getValues();
  var count = 0;
  var pattern = 'Diplim-MSTW-01-' + angkatan;

  for (var i = 1; i < data.length; i++) {
    var noCert = String(data[i][0]);
    if (noCert.indexOf(pattern) > -1) {
      count++;
    }
  }

  var nextSeq = count + 1;
  return padZero(nextSeq, 4);
}

// --- HELPER FUNCTIONS ---

function normalizePhone(phone) {
  if (!phone) return '';
  phone = String(phone).replace(/[^0-9]/g, '');
  if (phone.startsWith('08')) {
    phone = '62' + phone.substring(1);
  }
  return phone;
}

function getPredicate(score) {
  if (score >= 95) return 'Mumtaz';
  if (score >= 85) return 'Jayyid Jiddan Murtafi';
  if (score >= 80) return 'Jayyid Jiddan';
  if (score >= 75) return 'Jayyid Murtafi\'';
  if (score >= 60) return 'Jayyid';
  return 'Rasib';
}

function padZero(num, size) {
  var s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function formatDate(dateInput) {
  try {
    var d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    var day = padZero(d.getDate(), 2);
    var month = padZero(d.getMonth() + 1, 2);
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
  } catch (e) {
    return dateInput;
  }
}
