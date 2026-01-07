
if (typeof Config === 'undefined') {
  var Config = require('./Config.js');
}

function doSetup() {
  var props = PropertiesService.getScriptProperties();

  // 1. Setup Spreadsheet
  var ssid = props.getProperty("SPREADSHEET_ID");
  var ss;

  if (!ssid) {
    ss = SpreadsheetApp.create("DB_LMS_DIPLOMA_ILMI");
    ssid = ss.getId();
    props.setProperty("SPREADSHEET_ID", ssid);
    console.log("Created new Spreadsheet: " + ssid);
  } else {
    try {
      ss = SpreadsheetApp.openById(ssid);
      console.log("Using existing Spreadsheet: " + ssid);
    } catch(e) {
      ss = SpreadsheetApp.create("DB_LMS_DIPLOMA_ILMI");
      ssid = ss.getId();
      props.setProperty("SPREADSHEET_ID", ssid);
      console.log("Spreadsheet ID invalid. Created new one: " + ssid);
    }
  }

  // 2. Setup Sheets and Headers
  var schemas = {};
  // Define columns for each sheet
  schemas[Config.SHEET_NAMES.USERS_MAHASISWA] = ["NIM", "Email", "Password", "Nama", "WA", "Gender", "TempatLahir", "TglLahir", "Alamat", "Angkatan", "Mustawa", "Status_Akademik", "Klasifikasi", "Status_S1", "NIM_Lama", "Foto_URL"];
  schemas[Config.SHEET_NAMES.USERS_STAFF] = ["ID_Staff", "Nama", "Email", "Password", "Role", "WA", "Foto_URL"];
  schemas[Config.SHEET_NAMES.AKADEMIK_MK] = ["Kode_MK", "Nama_MK", "Mustawa", "ID_Dosen"];
  schemas[Config.SHEET_NAMES.AKADEMIK_JADWAL] = ["ID_Jadwal", "Kode_MK", "Hari", "Jam", "Link_Zoom", "Link_Rekaman"];
  schemas[Config.SHEET_NAMES.AKADEMIK_PRESENSI] = ["ID_Presensi", "NIM", "Kode_MK", "Pertemuan_Ke", "Tipe_Hadir", "Status", "Nilai", "Waktu_Input"];
  schemas[Config.SHEET_NAMES.AKADEMIK_NILAI] = ["ID", "NIM", "Kode_MK", "Nilai_Absen", "Nilai_Tugas", "Nilai_UTS", "Nilai_UAS", "Nilai_Akhir", "Predikat"];
  schemas[Config.SHEET_NAMES.KEUANGAN_TRANSAKSI] = ["Kode_Trx", "Tanggal", "ID_User", "Jenis", "Kategori", "Nominal", "Bukti_URL", "Status", "Keterangan"];
  schemas[Config.SHEET_NAMES.KEUANGAN_PENGAJUAN] = ["ID_Aju", "Tanggal", "ID_Staff", "Judul", "Deskripsi", "Nominal", "Status"];
  schemas[Config.SHEET_NAMES.KESISWAAN_SERTIFIKAT] = ["No_Sertifikat", "NIM", "Level", "Tanggal_Terbit", "File_URL", "Predikat_Lulus"];
  schemas[Config.SHEET_NAMES.LMS_BANK_SOAL] = ["ID_Soal", "Kode_MK", "ID_Dosen", "Judul", "Tipe", "Deadline", "JSON_Data_Pertanyaan"];
  schemas[Config.SHEET_NAMES.LMS_JAWABAN] = ["ID_Jawaban", "ID_Soal", "NIM", "JSON_Jawaban_Siswa", "Nilai", "Feedback"];
  schemas[Config.SHEET_NAMES.GENERAL_PENGUMUMAN] = ["ID", "Tanggal", "Judul", "Isi", "Target", "Gambar_URL", "JSON_Tombol"];

  for (var sheetName in schemas) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]); // Add headers
      console.log("Created Sheet: " + sheetName);
    } else {
      // Optional: Check if headers match, update if necessary.
      // For now, we assume if sheet exists, it's correct.
    }
  }

  // Clean up default "Sheet1" if it exists and we made others
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // 3. Setup Drive Folder
  var folderId = props.getProperty("DRIVE_FOLDER_ID");
  if (!folderId) {
    // Assuming root if no parent specified, or search for "LMS_UPLOADS"
    var folders = DriveApp.getFoldersByName(Config.FOLDER_NAME);
    if (folders.hasNext()) {
      folderId = folders.next().getId();
    } else {
      folderId = DriveApp.createFolder(Config.FOLDER_NAME).getId();
    }
    props.setProperty("DRIVE_FOLDER_ID", folderId);
    console.log("Set Drive Folder ID: " + folderId);
  } else {
    try {
        DriveApp.getFolderById(folderId);
    } catch(e) {
        // ID invalid, recreate
        var folders = DriveApp.getFoldersByName(Config.FOLDER_NAME);
        if (folders.hasNext()) {
          folderId = folders.next().getId();
        } else {
          folderId = DriveApp.createFolder(Config.FOLDER_NAME).getId();
        }
        props.setProperty("DRIVE_FOLDER_ID", folderId);
        console.log("Fixed Drive Folder ID: " + folderId);
    }
  }

  return {
      spreadsheetId: ssid,
      folderId: folderId,
      message: "Setup Complete"
  };
}

if (typeof module !== 'undefined') module.exports = { doSetup: doSetup };
