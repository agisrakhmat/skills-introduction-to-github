/**
 * DIPLOMA ILMI LMS - BACKEND (FINAL CLEAN VERSION)
 *
 * PETUNJUK DEPLOYMENT:
 * 1. Copy SEMUA isi file ini.
 * 2. Paste ke file 'Code.gs' di Google Apps Script project Anda.
 * 3. Simpan & Deploy sebagai Web App.
 */

/* =========================================
   1. KONFIGURASI (SETTINGS)
   ========================================= */
var Config = {
  // ID Spreadsheet Database
  SPREADSHEET_ID: '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE',

  // ID Google Drive untuk simpan Sertifikat
  DRIVE_FOLDER_ID: '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4',

  // ID Template Google Slides untuk Sertifikat
  SLIDE_TEMPLATE_ID: '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ',

  // Nama Sheet
  SHEET_USER: 'data_user',
  SHEET_CERTIFICATE: 'sertifikat',
  // Daftar Mata Kuliah
  SHEET_COURSES: ['Aqidah', 'Dakwah', "Fiqih Syafi'i", 'Fiqih Waris', 'Nahwu'],

  // Kolom Index Data Mahasiswa (Mulai dari 0 untuk Kolom A)
  COL_NIM: 0,        // A
  COL_NAMA: 1,       // B
  COL_JK: 2,         // C
  COL_ALAMAT: 3,     // D
  COL_PRODI: 4,      // E
  COL_HP: 5,         // F
  COL_ANGKATAN: 6,   // G
  COL_TEMPAT: 7,     // H
  COL_TGL: 8,        // I

  // PENGATURAN NILAI (PENTING!)
  // Nilai Akhir PASTI diambil dari Kolom K (Index 10)
  COL_NILAI_AKHIR: 10,

  // Format Nomor Sertifikat
  CERT_PREFIX: 'Diplim-MSTW-01-',
  CERT_CODE: '07', // Kode Angkatan/Batch

  // Kriteria Kelulusan
  MIN_NILAI_LULUS: 60, // Rata-rata minimal

  // Predikat Nilai
  PREDIKAT: [
    { min: 95, text: 'Mumtaz' },
    { min: 85, text: 'Jayyid Jiddan Murtafi' },
    { min: 80, text: 'Jayyid Jiddan' },
    { min: 75, text: "Jayyid Murtafi'" },
    { min: 60, text: 'Jayyid' }
  ]
};

/* =========================================
   2. DATABASE ENGINE
   ========================================= */
var Database = {
  _getSheet: function(name) {
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error("Sheet '" + name + "' tidak ditemukan!");
    return sheet;
  },

  // Bersihkan nomor HP (08xx -> 628xx)
  _cleanPhone: function(p) {
    if (!p) return '';
    p = String(p).replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    return p;
  },

  getUser: function(nim, phone) {
    var sheet = this._getSheet(Config.SHEET_USER);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var dbNim = String(row[Config.COL_NIM] || '').trim();
      var dbPhone = String(row[Config.COL_HP] || '').trim();

      if (dbNim.toLowerCase() === nim.toLowerCase() &&
          this._cleanPhone(dbPhone) === this._cleanPhone(phone)) {
        return {
          nim: dbNim,
          nama: row[Config.COL_NAMA],
          program: row[Config.COL_PRODI],
          angkatan: row[Config.COL_ANGKATAN],
          alamat: row[Config.COL_ALAMAT],
          tempat_lahir: row[Config.COL_TEMPAT],
          tanggal_lahir: row[Config.COL_TGL]
        };
      }
    }
    return null;
  },

  // AMBIL NILAI (HARDCODED KOLOM K)
  getGrade: function(courseName, nim) {
    // Paksa refresh data
    SpreadsheetApp.flush();

    var sheet = this._getSheet(courseName);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Asumsi NIM ada di Kolom A (Index 0)
      var dbNim = String(row[0] || '').trim();

      if (dbNim.toLowerCase() === nim.toLowerCase()) {
        // AMBIL LANGSUNG DARI KOLOM K (Index 10)
        var rawVal = row[Config.COL_NILAI_AKHIR];
        var finalScore = 0;

        if (typeof rawVal === 'number') {
          finalScore = rawVal;
        } else {
          // Bersihkan string (100,00 -> 100.00)
          var s = String(rawVal).replace(',', '.').replace(/[^\d.-]/g, '');
          finalScore = parseFloat(s) || 0;
        }

        return finalScore;
      }
    }
    return 0; // Tidak ada nilai = 0
  },

  getCertLog: function(nim) {
    try {
      var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        // Cek NIM di Kolom B (Index 1)
        if (String(data[i][1]).toLowerCase() === nim.toLowerCase()) {
          return data[i][4]; // Return URL di Kolom E
        }
      }
    } catch (e) { return null; }
    return null;
  },

  saveCertLog: function(no, nim, nama, url) {
    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    sheet.appendRow([no, nim, nama, new Date(), url]);
  },

  getNextCertSeq: function() {
    var sheet = this._getSheet(Config.SHEET_CERTIFICATE);
    var last = sheet.getLastRow();
    return Math.max(0, last - 1) + 1;
  }
};

/* =========================================
   3. LOGIKA UTAMA (SERVICE)
   ========================================= */
var Service = {
  getPredikat: function(score) {
    for (var i = 0; i < Config.PREDIKAT.length; i++) {
      if (score >= Config.PREDIKAT[i].min) return Config.PREDIKAT[i].text;
    }
    return 'Rasib'; // Tidak Lulus
  },

  formatDate: function(d) {
    if (Object.prototype.toString.call(d) === '[object Date]') {
      return ('0' + d.getDate()).slice(-2) + '/' +
             ('0' + (d.getMonth()+1)).slice(-2) + '/' +
             d.getFullYear();
    }
    return d;
  },

  createCert: function(user, avgScore) {
    var predikat = this.getPredikat(avgScore);
    var seq = Database.getNextCertSeq();
    var seqStr = ('0000' + seq).slice(-4);
    var certNo = Config.CERT_PREFIX + Config.CERT_CODE + '-' + seqStr;

    // Copy Template
    var tFile = DriveApp.getFileById(Config.SLIDE_TEMPLATE_ID);
    var folder = DriveApp.getFolderById(Config.DRIVE_FOLDER_ID);
    var copy = tFile.makeCopy(user.nim + '_' + user.nama, folder);

    try {
      var slide = SlidesApp.openById(copy.getId());
      var s = slide.getSlides()[0];

      // Replace Placeholder
      s.replaceAllText('<<nomor sertifikat>>', certNo);
      s.replaceAllText('<<nama>>', user.nama);
      s.replaceAllText('<<predikat>>', predikat);
      slide.saveAndClose();

      // Convert PDF
      var pdfBlob = copy.getAs(MimeType.PDF);
      var pdfFile = folder.createFile(pdfBlob);
      pdfFile.setName(user.nim + '_' + user.nama + '_' + user.program + '.pdf');

      copy.setTrashed(true); // Hapus slide temp

      var url = pdfFile.getUrl();
      Database.saveCertLog(certNo, user.nim, user.nama, url);
      return url;

    } catch (e) {
      copy.setTrashed(true);
      throw e;
    }
  },

  processRequest: function(nim, phone) {
    if (!nim || !phone) return { status: 'error', message: 'Input tidak lengkap' };

    var user = Database.getUser(nim, phone);
    if (!user) return { status: 'error', message: 'Data mahasiswa tidak ditemukan/No HP salah' };

    var total = 0;
    var listNilai = [];

    for (var i = 0; i < Config.SHEET_COURSES.length; i++) {
      var mk = Config.SHEET_COURSES[i];
      var score = Database.getGrade(mk, user.nim);

      listNilai.push({
        no: i+1,
        nama: mk,
        mutu: score,
        nilai: this.getPredikat(score),
        status: score >= 60 ? 'LL' : 'BL'
      });
      total += score;
    }

    var avg = total / Config.SHEET_COURSES.length;
    var lulus = avg >= Config.MIN_NILAI_LULUS;
    var certUrl = '';

    if (lulus) {
      // Cek log sertifikat dulu
      var existUrl = Database.getCertLog(user.nim);
      if (existUrl) {
        certUrl = existUrl;
      } else {
        try {
          certUrl = this.createCert(user, avg);
        } catch (e) {
          Logger.log('Cert Error: ' + e);
        }
      }
    }

    // Format TTL
    var ttl = (user.tempat_lahir || '-') + ', ' + this.formatDate(user.tanggal_lahir);

    return {
      status: 'success',
      data: {
        nim: user.nim,
        nama: user.nama,
        program_pembelajaran: user.program,
        angkatan: user.angkatan,
        alamat: user.alamat,
        ttl: ttl,
        status_kelulusan: lulus,
        sertifikat_url: certUrl,
        nilai: listNilai
      }
    };
  }
};

/* =========================================
   4. ROUTER API (DO GET)
   ========================================= */
function doGet(e) {
  var out = {};
  try {
    var p = e.parameter;
    out = Service.processRequest(p.nim, p.phone);
  } catch (err) {
    out = { status: 'error', message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
