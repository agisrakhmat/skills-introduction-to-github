// --- Database.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }

var Database = {
  // Define Schema for Validation & Setup
  SCHEMA: {
    // Defined dynamically below or hardcoded if Config is available
  },

  setupDatabase: function() {
    this._initSchema();
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheets = Object.keys(Database.SCHEMA);

    sheets.forEach(function(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        var headers = Database.SCHEMA[sheetName];
        sheet.appendRow(headers);
        try {
            sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        } catch (e) {}
      } else {
        // Simple Migration: Check if headers match, if not append new cols?
        // For now, we assume standard setup. User can manually add cols if needed.
      }
    });

    return "Setup Success";
  },

  getTable: function(sheetName) {
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      results.push(obj);
    }
    return results;
  },

  insertRow: function(sheetName, dataObj) {
    this._initSchema();
    var ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet " + sheetName + " not found");

    var headers = Database.SCHEMA[sheetName];
    // Re-read headers from sheet to be safe against manual changes
    var sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var rowData = sheetHeaders.map(function(header) {
      return dataObj[header] || "";
    });

    sheet.appendRow(rowData);
    return true;
  },

  _initSchema: function() {
    if (Object.keys(this.SCHEMA).length > 0) return;

    // UPDATED SCHEMA TO MATCH USER FRONTEND
    this.SCHEMA[Config.SHEETS.USERS_MAHASISWA] = [
      "NIM", "Nama", "Email", "NoWA", "Password_Hash", "Gender",
      "Tahun_Masuk", "Kode_Angkatan", "Status_Klasifikasi", "Mustawa_Saat_Ini",
      "Status_Aktif", "Tgl_Daftar", "Alamat", "Tgl_Lahir", "Status_S1", "NIM_Lama"
    ];
    this.SCHEMA[Config.SHEETS.USERS_STAFF] = [
      "Kode_Staff", "Nama", "Email", "Role", "Password_Hash", "NoWA"
    ];
    this.SCHEMA[Config.SHEETS.MATAKULIAH] = [
      "Kode_MK", "Nama_MK", "Mustawa", "SKS", "Dosen_Pengampu"
    ];
    this.SCHEMA[Config.SHEETS.JADWAL] = [
      "ID_Jadwal", "Kode_MK", "Hari", "Jam_Mulai", "Jam_Selesai", "Link_Zoom", "Link_Youtube"
    ];
    this.SCHEMA[Config.SHEETS.PRESENSI] = [
      "ID_Presensi", "NIM", "Kode_MK", "Pertemuan_Ke", "Status_Hadir", "Poin", "Tanggal", "Bukti_Izin"
    ];
    this.SCHEMA[Config.SHEETS.NILAI] = [
      "ID_Nilai", "NIM", "Kode_MK", "Nilai_Absen", "Nilai_Latihan", "Nilai_UTS", "Nilai_UAS",
      "Nilai_Akhir", "Predikat", "Status_Lulus"
    ];
    this.SCHEMA[Config.SHEETS.TRANSAKSI] = [
      "Kode_Trans", "NIM", "Jenis_Transaksi", "Nominal", "Bukti_Transfer",
      "Status", "Tgl_Input", "Tgl_Verifikasi", "Petugas_Verifikator", "Komitmen_Bayar"
    ];
    this.SCHEMA[Config.SHEETS.PENGUMUMAN] = [
      "Kode_Pengumuman", "Judul", "Isi_Pesan", "Link_Gambar_Slide", "Target_Role", "Tgl_Terbit", "Pembuat"
    ];
    this.SCHEMA[Config.SHEETS.SERTIFIKAT] = [
      "Kode_Sertifikat", "NIM", "Jenis_Sertifikat", "Mustawa_Lulus", "Tgl_Terbit", "Link_File_PDF"
    ];
  }
};

if (typeof module !== 'undefined') module.exports = Database;
