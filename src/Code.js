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
  // Daftar Mata Kuliah (Pastikan nama sheet sesuai)
  COURSES: ['Aqidah', 'Dakwah', 'Fiqh_Syafii', 'Fiqh_Waris', 'Nahwu']
};

/**
 * Fungsi Utama: Menangani Request GET dari Widget
 * Parameter: ?nim=...&phone=...
 */
function doGet(e) {
  var params = e ? e.parameter : {}; // Cegah error jika e undefined (Manual Run)
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
 * Jalankan fungsi ini di Editor Apps Script untuk simulasi
 */
function testManual() {
  // Ganti data di bawah ini sesuai data asli di spreadsheet Anda untuk testing
  var mockEvent = {
    parameter: {
      nim: 'DI.AT.25.07.RGR.0000', // Ganti dengan NIM valid
      phone: '628123456789'        // Ganti dengan No HP valid
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

  // 2. Ambil Nilai Mata Kuliah
  var gradeData = getStudentGrades(ss, student.nim, CONF.COURSES);

  // 3. Hitung Rata-Rata & Kelulusan
  var averageScore = gradeData.totalScore / (gradeData.courseCount || 1);
  var isGraduated = averageScore >= 60; // Syarat lulus rata-rata >= 60
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
      program_pembelajaran: student.program, // Mapping dari 'Program'
      angkatan: student.angkatan,
      alamat: student.alamat,
      ttl: student.tempat_lahir + ', ' + formatDate(student.tanggal_lahir),
      status_kelulusan: isGraduated,
      sertifikat_url: certUrl,
      nilai: gradeData.details
    }
  };
}

/**
 * Mencari Mahasiswa di Sheet 'data_user'
 * Validasi NIM dan No HP (Normalized)
 */
function findStudent(ss, nimInput, phoneInput) {
  var sheet = ss.getSheetByName(CONF.SHEET_NAME_USER);
  var data = sheet.getDataRange().getDisplayValues(); // Pakai display values untuk string
  // Header: NIM(A), Nama(B), JK(C), Alamat(D), Program(E), Telp(F), Angkatan(G), TmpLahir(H), TglLahir(I)

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
        tanggal_lahir: row[8] // Asumsi format string di sheet sudah benar atau perlu parsing
      };
    }
  }
  return null;
}

/**
 * Mengambil Nilai dari setiap Sheet Mata Kuliah
 */
function getStudentGrades(ss, nim, courses) {
  var details = [];
  var totalScore = 0;
  var courseCount = 0;

  courses.forEach(function(courseName, index) {
    var sheet = ss.getSheetByName(courseName);
    if (!sheet) return; // Skip jika sheet tidak ada

    var data = sheet.getDataRange().getValues(); // Get Values (raw) untuk angka
    // Asumsi Struktur: NIM(A)... Nilai_Akhir(K) -> Index 10

    var score = 0;
    var found = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === nim) {
        score = parseFloat(data[i][10]) || 0; // Kolom K
        found = true;
        break;
      }
    }

    if (found) {
      totalScore += score;
      courseCount++;

      // Tentukan Predikat Per Mapel
      var mutu = getPredicate(score);
      // Status Per Mapel (Asumsi >= 60 Lulus)
      var status = score >= 60 ? 'LL' : 'BL';

      details.push({
        no: courseCount,
        nama: courseName.replace(/_/g, " "), // Rapikan nama (Fiqh_Syafii -> Fiqh Syafii)
        nilai: mutu,       // Frontend minta teks (Mumtaz) di kolom 'nilai'
        mutu: score,       // Frontend minta angka di kolom 'mutu'
        status: status
      });
    }
  });

  return {
    details: details,
    totalScore: totalScore,
    courseCount: courseCount
  };
}

/**
 * Menghandle Logika Sertifikat (Cek Existing -> Generate Baru)
 */
function handleCertificate(ss, student, predikat) {
  var sheetCert = ss.getSheetByName(CONF.SHEET_NAME_SERTIFIKAT);
  var data = sheetCert.getDataRange().getDisplayValues();

  // 1. Cek apakah sudah ada sertifikat
  for (var i = 1; i < data.length; i++) {
    // Cek Nama (Kolom B)
    if (String(data[i][1]).trim().toUpperCase() === String(student.nama).trim().toUpperCase()) {
      // Return Link (Kolom E)
      return data[i][4];
    }
  }

  // 2. Generate Baru
  return generateNewCertificate(ss, sheetCert, student, predikat);
}

/**
 * Generate PDF Baru
 */
function generateNewCertificate(ss, sheetCert, student, predikat) {
  // Hitung Nomor Urut (XXXX) berdasarkan Angkatan
  var sequence = getNextSequence(sheetCert, student.angkatan);
  var certNumber = 'Diplim-MSTW-01-' + student.angkatan + '-' + sequence;

  // Nama File
  var fileName = student.nim + '_' + student.nama + '_' + student.program;

  // Copy Template Slide
  var templateFile = DriveApp.getFileById(CONF.SLIDE_TEMPLATE_ID);
  var targetFolder = DriveApp.getFolderById(CONF.DRIVE_FOLDER_ID);
  var copyFile = templateFile.makeCopy(fileName, targetFolder);
  var copyId = copyFile.getId();

  // Edit Slide (Replace Text)
  var pres = SlidesApp.openById(copyId);
  var slide = pres.getSlides()[0];

  // Replace placeholders
  slide.replaceAllText('<<nama>>', student.nama);
  slide.replaceAllText('<<nomor sertifikat>>', certNumber);
  slide.replaceAllText('<<predikat>>', predikat);

  pres.saveAndClose();

  // Convert to PDF
  var pdfBlob = copyFile.getAs(MimeType.PDF);
  var pdfFile = targetFolder.createFile(pdfBlob);
  var pdfUrl = pdfFile.getUrl(); // Atau getDownloadUrl()

  // Hapus File Slide Temporary
  copyFile.setTrashed(true);

  // Simpan ke Sheet Sertifikat
  // Schema: No_Sertifikat(A), Nama(B), Peringkat(C), Timestamp(D), Link_Sertifikat(E)
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
 * Menghitung Sequence Number (0001, 0002) per Angkatan
 * Logic: Hitung berapa banyak row di sheet sertifikat yang memiliki Angkatan sama di No Sertifikat
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
  phone = String(phone).replace(/[^0-9]/g, ''); // Hapus non-angka
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
  return 'Rasib'; // Tidak Lulus
}

function padZero(num, size) {
  var s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function formatDate(dateInput) {
  // Asumsi input string atau Date object.
  // Jika dari sheet biasanya Date Object jika format cell Date, atau string.
  // Kita coba parse sederhana.
  try {
    var d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput; // Return as is if fail
    var day = padZero(d.getDate(), 2);
    var month = padZero(d.getMonth() + 1, 2);
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
  } catch (e) {
    return dateInput;
  }
}
