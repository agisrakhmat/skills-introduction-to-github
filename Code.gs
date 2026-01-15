// ID KONFIGURASI
const SPREADSHEET_ID = '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE';
const DRIVE_FOLDER_ID = '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4';
const SLIDE_TEMPLATE_ID = '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ';

// KONSTANTA
const SHEET_USER = 'data_user';
const SHEET_SERTIFIKAT = 'Sertifikat';
const SHEET_MAPEL = ['Aqidah', 'Dakwah', 'Fiqh_Syafii', 'Fiqh_Waris', 'Nahwu'];
const KKM_MAPEL = 60; // Nilai minimal per mapel untuk status LL
const KKM_LULUS = 60; // Rata-rata minimal untuk lulus program
const KODE_JENJANG = '01'; // Kode jenjang statis (bisa diubah manual)

function doGet(e) {
  const result = handleRequest(e);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e) {
  try {
    const params = e.parameter;
    const nim = params.nim;
    const phone = params.phone;

    if (!nim || !phone) {
      return responseError('Parameter NIM dan Phone wajib diisi.');
    }

    // 1. Verifikasi User
    const student = verifyUser(nim, phone);
    if (!student) {
      return responseError('NIM atau Nomor Telepon tidak ditemukan/tidak cocok.');
    }

    // 2. Ambil Nilai & Hitung Kelulusan
    const academicData = getStudentGrades(nim);

    // 3. Cek Status Kelulusan Akhir
    const isGraduated = academicData.average >= KKM_LULUS;
    let sertifikatUrl = null;

    // 4. Generate Sertifikat (Hanya jika Lulus)
    if (isGraduated) {
      // Tentukan Predikat
      const predikat = determinePredicate(academicData.average);

      // Proses Sertifikat (Get existing or Create new)
      const certData = handleCertificate(student, predikat);
      sertifikatUrl = certData.url;
    }

    // 5. Susun Response JSON
    return {
      status: 'success',
      data: {
        nim: student.nim,
        nama: student.nama,
        program_pembelajaran: 'Diploma Ilmi', // Default value sesuai konteks
        angkatan: student.angkatan,
        alamat: student.alamat,
        ttl: student.ttl,
        nilai: academicData.grades, // Array nilai per mapel
        average: academicData.average,
        status_kelulusan: isGraduated,
        sertifikat_url: sertifikatUrl
      }
    };

  } catch (error) {
    return responseError('Terjadi kesalahan server: ' + error.toString());
  }
}

// --- HELPER FUNCTIONS ---

function responseError(msg) {
  return {
    status: 'error',
    message: msg
  };
}

function verifyUser(nim, phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USER);
  const data = sheet.getDataRange().getValues();

  // Asumsi Header di baris 1, data mulai baris 2
  // Kolom A: NIM (Index 0)
  // Kolom B: Nama (Index 1)
  // Kolom D: Alamat (Index 3)
  // Kolom F: No HP (Index 5)
  // Kolom G: Angkatan (Index 6)
  // Kolom H: Tempat Lahir (Index 7)
  // Kolom I: Tanggal Lahir (Index 8)

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dbNim = String(row[0]).trim().toLowerCase();
    const dbPhone = String(row[5]).trim(); // Normalisasi phone perlu diperhatikan (misal 08 vs 628)

    // Normalisasi input
    const inputNim = String(nim).trim().toLowerCase();
    // Normalisasi Phone sederhana (hapus spasi/dash)
    const inputPhoneClean = String(phone).replace(/\D/g, '');
    const dbPhoneClean = dbPhone.replace(/\D/g, '');

    if (dbNim === inputNim && dbPhoneClean.includes(inputPhoneClean)) { // Menggunakan includes agar lebih toleran (misal user input tanpa 62)
      return {
        nim: row[0],
        nama: row[1],
        alamat: row[3],
        phone: row[5],
        angkatan: row[6],
        ttl: `${row[7]}, ${formatDate(row[8])}` // Gabung Tempat, Tgl Lahir
      };
    }
  }
  return null;
}

function getStudentGrades(nim) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let totalScore = 0;
  let gradeList = [];

  // Loop setiap sheet mata kuliah
  SHEET_MAPEL.forEach((mapelName, index) => {
    const sheet = ss.getSheetByName(mapelName);
    if (!sheet) return; // Skip jika sheet tidak ada

    const data = sheet.getDataRange().getValues();
    let score = 0;
    let mutu = '-';
    let found = false;

    // Cari NIM di Kolom A (Index 0)
    // Kolom K: Nilai Akhir (Index 10)
    // Kolom L: Keterangan/Mutu (Index 11)

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === String(nim).trim().toLowerCase()) {
        score = parseFloat(data[i][10]) || 0;
        mutu = data[i][11] || '-'; // Huruf (Mumtaz/A/dll)
        found = true;
        break;
      }
    }

    // Logika Status Per Mapel
    const status = (found && score >= KKM_MAPEL) ? 'LL' : 'BL';

    gradeList.push({
      no: index + 1,
      nama: mapelName.replace(/_/g, ' '), // Rapikan nama (Fiqh_Syafii -> Fiqh Syafii)
      nilai: score, // Angka (Column K)
      mutu: mutu,   // Huruf (Column L)
      status: status
    });

    totalScore += score;
  });

  const average = totalScore / SHEET_MAPEL.length;

  return {
    grades: gradeList,
    average: average
  };
}

function determinePredicate(avg) {
  if (avg >= 95) return "Mumtaz";
  if (avg >= 85) return "Jayyid Jiddan Murtafi";
  if (avg >= 80) return "Jayyid Jiddan";
  if (avg >= 75) return "Jayyid Murtafi'";
  if (avg >= 60) return "Jayyid";
  return "-";
}

function handleCertificate(student, predikat) {
  const lock = LockService.getScriptLock();
  // Tunggu maksimal 30 detik untuk lock
  try {
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('Server sibuk, silakan coba lagi beberapa saat.');
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetCert = ss.getSheetByName(SHEET_SERTIFIKAT);

    // 1. Cek apakah sudah ada sertifikat untuk NIM ini? (Berdasarkan Nama/NIM yang unik)
    // Karena struktur sheet Sertifikat tidak punya kolom NIM, kita cari berdasarkan Nama.
    // Idealnya ada kolom NIM di sheet Sertifikat untuk akurasi.
    // Berdasarkan request: "Cek terlebih dahulu di sheet Sertifikat... Ambil URL".
    // Kita asumsikan Kolom B (Nama) unik atau kombinasi Nama + Angkatan cukup unik.
    // Namun, paling aman jika kita cari berdasarkan Nama dulu.

    const dataCert = sheetCert.getDataRange().getValues();
    for (let i = 1; i < dataCert.length; i++) {
      if (String(dataCert[i][1]).toLowerCase() === String(student.nama).toLowerCase()) {
        // Sudah ada
        return { url: dataCert[i][4] }; // Kolom E: Link
      }
    }

    // 2. Jika Belum Ada -> Generate Baru
    // Generate Nomor
    // Format: Diplim-MSTW-01-[Angkatan]-[XXXX]
    // XXXX berdasarkan jumlah data row (row terakhir - header) + 1
    const lastRow = sheetCert.getLastRow();
    const count = lastRow; // Header row 1, jadi data = lastRow - 1. Tapi urutan dimulai dari 1.
    // Misal: Header saja (row 1). Count = 1. Next ID = 0001.
    // Misal: Header + 1 data (row 2). Count = 2. Next ID = 0002.
    // Logika request: "jumlah data yang sudah ada + 1".
    // Jumlah data = lastRow - 1. Next sequence = (lastRow - 1) + 1 = lastRow.
    // Tetapi jika sheet kosong (hanya header), lastRow=1. Sequence=1.
    // Jika ada 1 data, lastRow=2. Sequence=2.
    const sequence = padNumber(lastRow, 4);
    const noSertifikat = `Diplim-MSTW-${KODE_JENJANG}-${student.angkatan}-${sequence}`;

    // Buat PDF
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const templateFile = DriveApp.getFileById(SLIDE_TEMPLATE_ID);

    // Copy Template
    const tempCopy = templateFile.makeCopy(`Sertifikat ${student.nama}`, folder);
    const slideId = tempCopy.getId();
    const slides = SlidesApp.openById(slideId);
    const slide = slides.getSlides()[0]; // Slide pertama

    // Replace Placeholders
    // Placeholders: <<nomor sertifikat>>, <<nama>>, <<predikat>>
    slide.replaceAllText('<<nomor sertifikat>>', noSertifikat);
    slide.replaceAllText('<<nama>>', student.nama);
    slide.replaceAllText('<<predikat>>', predikat);
    // Jika user ternyata pakai "nomor registrasi", kita jaga-jaga replace juga
    slide.replaceAllText('<<nomor registrasi>>', noSertifikat);

    slides.saveAndClose();

    // Convert ke PDF
    const pdfBlob = tempCopy.getAs(ContentService.MimeType.PDF);
    const pdfFile = folder.createFile(pdfBlob);
    pdfFile.setName(`Sertifikat - ${student.nama}.pdf`);

    // Set Permission Public (agar bisa diakses user)
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const pdfUrl = pdfFile.getUrl(); // Atau pdfFile.getDownloadUrl()

    // Hapus file slide temporary
    tempCopy.setTrashed(true);

    // Simpan Log ke Sheet Sertifikat
    // Kolom A: No_Sertifikat, B: Nama, C: Peringkat, D: Timestamp, E: Link
    sheetCert.appendRow([
      noSertifikat,
      student.nama,
      predikat,
      new Date(),
      pdfUrl
    ]);

    return { url: pdfUrl };

  } catch (err) {
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function padNumber(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  if (dateObj instanceof Date) {
    const day = dateObj.getDate();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  }
  return String(dateObj);
}
