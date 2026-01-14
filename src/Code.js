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
  // Nama Sheet Matakuliah Baku (Tanpa Spasi)
  COURSES: ['Aqidah', 'Dakwah', 'Fiqh_Syafii', 'Fiqh_Waris', 'Nahwu']
};

/**
 * ==========================================
 * BAGIAN 1: SETUP DATABASE (Jalankan Sekali)
 * ==========================================
 */

/**
 * Fungsi ini akan memperbaiki struktur Spreadsheet Anda secara otomatis.
 * Cara pakai: Pilih fungsi 'setupDatabase' di editor, lalu klik Run.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.openById(CONF.SPREADSHEET_ID);

  // 1. Setup Sheet User
  setupSheet(ss, CONF.SHEET_NAME_USER, [
    'NIM', 'Nama', 'Jenis_Kelamin', 'Alamat', 'Program',
    'Nomor_Telepon', 'Angkatan', 'Tempat_Lahir', 'Tanggal_Lahir'
  ]);

  // 2. Setup Sheet Sertifikat
  setupSheet(ss, CONF.SHEET_NAME_SERTIFIKAT, [
    'No_Sertifikat', 'Nama', 'Predikat', 'Tanggal_Generate', 'Link_File'
  ]);

  // 3. Setup Sheet Mata Kuliah
  var headerMatkul = [
    'NIM', 'Nama', 'Absen', 'Tugas 1', 'Tugas 2', 'Tugas 3',
    'Tugas 4', 'Rata-Rata', 'UTS', 'UAS', 'Nilai_Akhir', 'Keterangan'
  ];
  // NOTE: 'Nilai_Akhir' ada di index ke-10 (Kolom K)

  CONF.COURSES.forEach(function(courseName) {
    setupSheet(ss, courseName, headerMatkul);
  });

  Logger.log("SETUP SELESAI. Silahkan cek Spreadsheet Anda.");
}

/** Helper untuk membuat/memperbaiki header sheet */
function setupSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    Logger.log("Membuat Sheet Baru: " + sheetName);
  } else {
    Logger.log("Memperbaiki Sheet: " + sheetName);
  }

  // Set Header di Baris 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  // Bekukan Baris 1
  sheet.setFrozenRows(1);
}

/**
 * Fungsi untuk membuat data contoh (Dummy)
 * Jalankan ini jika ingin melihat contoh pengisian data yang benar
 */
function createDummyData() {
  var ss = SpreadsheetApp.openById(CONF.SPREADSHEET_ID);

  // Dummy User
  var sheetUser = ss.getSheetByName(CONF.SHEET_NAME_USER);
  if (sheetUser.getLastRow() === 1) { // Hanya isi jika kosong
    sheetUser.appendRow([
      'DI.AT.25.07.RGR.0000', 'Siswa Contoh', 'L', 'Jl. Contoh No. 1', 'Diploma Ilmi',
      '628123456789', '2025', 'Jakarta', '2000-01-01'
    ]);
  }

  // Dummy Nilai
  CONF.COURSES.forEach(function(course) {
    var sheet = ss.getSheetByName(course);
    if (sheet.getLastRow() === 1) {
      sheet.appendRow([
        'DI.AT.25.07.RGR.0000', 'Siswa Contoh', 100, 100, 100, 100,
        100, 100, 90, 90, 95, 'Lulus' // 95 di Kolom K (Nilai Akhir)
      ]);
    }
  });
}

/**
 * ==========================================
 * BAGIAN 2: BACKEND API (Jangan Diubah)
 * ==========================================
 */

function doGet(e) {
  var params = e ? e.parameter : {};
  var nim = params.nim;
  var phone = params.phone;

  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  if (!nim || !phone) {
    return output.setContent(JSON.stringify({
      status: 'error',
      message: 'Parameter wajib diisi. Jalankan setupDatabase() dulu jika baru pertama kali.'
    }));
  }

  try {
    var result = processStudentRequest(nim, phone);
    return output.setContent(JSON.stringify(result));
  } catch (err) {
    return output.setContent(JSON.stringify({
      status: 'error',
      message: 'Error Sistem: ' + err.toString()
    }));
  }
}

function processStudentRequest(nimInput, phoneInput) {
  var ss = SpreadsheetApp.openById(CONF.SPREADSHEET_ID);

  // 1. Cari Mahasiswa
  var student = findStudent(ss, nimInput, phoneInput);
  if (!student) {
    return { status: 'error', message: 'Data tidak ditemukan.' };
  }

  // 2. Ambil Nilai (STRICT MODE: Kolom K)
  var gradeData = getStudentGrades(ss, student.nim, CONF.COURSES);

  // 3. Hitung Rata-Rata
  var averageScore = gradeData.totalScore / (gradeData.courseCount || 1);
  var isGraduated = averageScore >= 60;
  var finalPredicate = getPredicate(averageScore);

  // 4. Sertifikat
  var certUrl = '';
  if (isGraduated) {
    certUrl = handleCertificate(ss, student, finalPredicate);
  }

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
    }
  };
}

function findStudent(ss, nimInput, phoneInput) {
  var sheet = ss.getSheetByName(CONF.SHEET_NAME_USER);
  if (!sheet) return null;

  var data = sheet.getDataRange().getDisplayValues();
  var cleanNim = nimInput.trim().toUpperCase();
  var cleanPhone = normalizePhone(phoneInput);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Kolom A(0)=NIM, Kolom F(5)=Phone
    if (String(row[0]).trim().toUpperCase() === cleanNim && normalizePhone(row[5]) === cleanPhone) {
      return {
        nim: row[0],
        nama: row[1],
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

function getStudentGrades(ss, nim, courses) {
  var details = [];
  var totalScore = 0;
  var courseCount = 0;

  courses.forEach(function(courseName, index) {
    var sheet = ss.getSheetByName(courseName);
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var found = false;
    var score = 0;

    for (var i = 1; i < data.length; i++) {
      // Kolom A (Index 0) = NIM
      if (String(data[i][0]).trim().toUpperCase() === nim) {
        // Kolom K (Index 10) = NILAI AKHIR (STRICT)
        score = parseFloat(data[i][10]) || 0;
        found = true;
        break;
      }
    }

    if (found) {
      totalScore += score;
      courseCount++;
      details.push({
        no: courseCount,
        nama: courseName.replace(/_/g, " "),
        nilai: getPredicate(score),
        mutu: score,
        status: score >= 60 ? 'LL' : 'BL'
      });
    }
  });

  return {
    details: details,
    totalScore: totalScore,
    courseCount: courseCount
  };
}

function handleCertificate(ss, student, predikat) {
  var sheet = ss.getSheetByName(CONF.SHEET_NAME_SERTIFIKAT);
  if (!sheet) return "";

  var data = sheet.getDataRange().getDisplayValues();
  // Cek Nama (Kolom B/Index 1)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toUpperCase() === String(student.nama).trim().toUpperCase()) {
      return data[i][4]; // Return Link (Kolom E)
    }
  }

  // Generate Baru
  var seq = getNextSequence(sheet, student.angkatan);
  var certNum = 'Diplim-MSTW-01-' + student.angkatan + '-' + seq;
  var fName = student.nim + '_' + student.nama;

  var template = DriveApp.getFileById(CONF.SLIDE_TEMPLATE_ID);
  var folder = DriveApp.getFolderById(CONF.DRIVE_FOLDER_ID);
  var copy = template.makeCopy(fName, folder);

  var slide = SlidesApp.openById(copy.getId()).getSlides()[0];
  slide.replaceAllText('<<nama>>', student.nama);
  slide.replaceAllText('<<nomor sertifikat>>', certNum);
  slide.replaceAllText('<<predikat>>', predikat);
  slide.getParent().saveAndClose();

  var pdf = folder.createFile(copy.getAs(MimeType.PDF));
  copy.setTrashed(true);

  sheet.appendRow([certNum, student.nama, predikat, new Date(), pdf.getUrl()]);
  return pdf.getUrl();
}

function getNextSequence(sheet, angkatan) {
  var data = sheet.getDataRange().getValues();
  var count = 0;
  var ptrn = 'Diplim-MSTW-01-' + angkatan;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).includes(ptrn)) count++;
  }
  return padZero(count + 1, 4);
}

function normalizePhone(p) {
  p = String(p).replace(/[^0-9]/g, '');
  if (p.startsWith('08')) p = '62' + p.substring(1);
  return p;
}

function getPredicate(s) {
  if (s >= 95) return 'Mumtaz';
  if (s >= 85) return 'Jayyid Jiddan Murtafi';
  if (s >= 80) return 'Jayyid Jiddan';
  if (s >= 75) return 'Jayyid Murtafi\'';
  if (s >= 60) return 'Jayyid';
  return 'Rasib';
}

function padZero(n, size) {
  var s = String(n);
  while (s.length < size) s = "0" + s;
  return s;
}

function formatDate(d) {
  try {
    var date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return padZero(date.getDate(), 2) + '/' + padZero(date.getMonth() + 1, 2) + '/' + date.getFullYear();
  } catch(e) { return d; }
}

function testManual() {
  Logger.log(doGet({parameter:{nim:'DI.AT.25.07.RGR.0000', phone:'628123456789'}}).getContent());
}
