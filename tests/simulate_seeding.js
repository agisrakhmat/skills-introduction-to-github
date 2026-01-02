/**
 * test_setup.js
 * Script Node.js lokal untuk memverifikasi logika seeding data dummy.
 * Script ini MOCKING service Google Apps Script (SpreadsheetApp) untuk melihat output data.
 */

const DatabaseSetup = require('../src/DatabaseSetup.gs');
const CONFIG = require('../src/Config.gs');

// --- MOCKING GOOGLE APPS SCRIPT SERVICES ---

class MockRange {
  constructor(row, col, numRows, numCols) {
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }
  setFontWeight(w) { console.log(`[Mock] Range(${this.row},${this.col}) setFontWeight: ${w}`); }
  setValue(v) { console.log(`[Mock] Range(${this.row},${this.col}) setValue: ${v}`); }
}

class MockSheet {
  constructor(name) {
    this.name = name;
    this.data = []; // Array of arrays (rows)
  }
  appendRow(rowArray) {
    this.data.push(rowArray);
    // console.log(`[Mock] Sheet '${this.name}' appendRow:`, rowArray);
  }
  getRange(row, col, numRows, numCols) {
    return new MockRange(row, col, numRows, numCols);
  }
  getLastRow() {
    return this.data.length;
  }
}

class MockSpreadsheet {
  constructor(id) {
    this.id = id;
    this.sheets = {};
  }
  getSheetByName(name) {
    return this.sheets[name] || null;
  }
  insertSheet(name) {
    this.sheets[name] = new MockSheet(name);
    return this.sheets[name];
  }
}

// Global Mocks
global.SpreadsheetApp = {
  openById: (id) => {
    if (!global.mockSS) {
      global.mockSS = new MockSpreadsheet(id);
    }
    return global.mockSS;
  }
};

// --- END MOCKING ---

function runTest() {
  console.log("=== MEMULAI TEST GENERASI DATA DUMMY (UPDATED) ===");

  // 1. Test Create Headers
  console.log("\n1. Menjalankan createSheetHeaders()...");
  DatabaseSetup.createSheetHeaders();

  // Validasi Header
  const userSheet = global.mockSS.getSheetByName(CONFIG.SHEET_NAMES.USERS);
  if (userSheet && userSheet.data.length > 0) {
    console.log("✅ Sheet 'Users' berhasil dibuat dengan header.");
  } else {
    console.error("❌ Gagal membuat Sheet 'Users'.");
  }

  // 2. Test Seed Dummy Data
  console.log("\n2. Menjalankan seedDummyData()...");
  DatabaseSetup.seedDummyData();

  // Validasi Data Lengkap
  console.log("\nVerifikasi Jumlah Data per Sheet:");

  const checkCount = (sheetName, minExpected) => {
    const sheet = global.mockSS.getSheetByName(sheetName);
    const count = sheet ? sheet.data.length - 1 : 0; // -1 for header
    if (count >= minExpected) {
      console.log(`✅ ${sheetName}: ${count} rows (Expected >= ${minExpected})`);
    } else {
      console.error(`❌ ${sheetName}: ${count} rows (Expected >= ${minExpected})`);
    }
    return count;
  };

  checkCount(CONFIG.SHEET_NAMES.USERS, 10);
  checkCount(CONFIG.SHEET_NAMES.COURSES, 11);
  checkCount(CONFIG.SHEET_NAMES.SCHEDULES, 11);
  checkCount(CONFIG.SHEET_NAMES.LESSONS, 22); // ~2 per course
  checkCount(CONFIG.SHEET_NAMES.PAYMENTS, 10); // 1 per user
  checkCount(CONFIG.SHEET_NAMES.COSTS, 2);
  checkCount(CONFIG.SHEET_NAMES.PAYROLL, 5); // At least some lecturers
  checkCount(CONFIG.SHEET_NAMES.CERTIFICATE_TEMPLATES, 1);
  checkCount(CONFIG.SHEET_NAMES.CERTIFICATES_ISSUED, 1);
  checkCount(CONFIG.SHEET_NAMES.COUNTERS, 2);
  checkCount(CONFIG.SHEET_NAMES.PERF_LOGS, 1);
  checkCount(CONFIG.SHEET_NAMES.ATTENDANCE_TEACHER, 100); // 12 weeks * many schedules

  // Cek Relasi Payment -> User
  console.log("\nVerifikasi Relasi Payment:");
  const payments = global.mockSS.getSheetByName(CONFIG.SHEET_NAMES.PAYMENTS).data;
  if (payments.length > 1) {
      const samplePayment = payments[1];
      const userIdInPayment = samplePayment[1];
      console.log(`Sample Payment UserID: ${userIdInPayment}`);
      if (userIdInPayment.startsWith("U-")) {
          console.log("✅ Format UserID pada Payment valid.");
      } else {
          console.error("❌ Format UserID pada Payment salah.");
      }
  }

  console.log("\n=== TEST SELESAI ===");
}

runTest();
