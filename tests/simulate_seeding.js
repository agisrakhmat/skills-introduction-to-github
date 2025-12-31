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
  console.log("=== MEMULAI TEST GENERASI DATA DUMMY ===");

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

  // Validasi Data
  // Cek Users
  const users = global.mockSS.getSheetByName(CONFIG.SHEET_NAMES.USERS).data;
  // Header is row 0, data starts at row 1
  const studentCount = users.length - 1; // minus header
  console.log(`Jumlah User yang dibuat: ${studentCount} (Target: 10)`);
  if (studentCount === 10) {
      console.log("✅ Jumlah mahasiswa sesuai.");
  } else {
      console.error("❌ Jumlah mahasiswa tidak sesuai.");
  }

  // Cek Enrollments
  const enrollments = global.mockSS.getSheetByName(CONFIG.SHEET_NAMES.ENROLLMENTS).data;
  console.log(`Jumlah Enrollment yang dibuat: ${enrollments.length - 1}`);

  // Cek Nilai (Sample)
  if (enrollments.length > 1) {
    const sampleEnrollment = enrollments[1]; // Row 1 (header is 0)
    console.log("Sampel Enrollment Row:", sampleEnrollment);

    // Validasi range nilai akhir (index 6 adalah Final Score)
    const finalScore = parseFloat(sampleEnrollment[6]);
    console.log(`Nilai Akhir Sampel: ${finalScore}`);
    if (finalScore >= 0 && finalScore <= 100) {
        console.log("✅ Perhitungan nilai akhir logis (0-100).");
    } else {
        console.error("❌ Nilai akhir di luar jangkauan.");
    }
  }

  // Cek Courses Gender Separation
  console.log("\nVerifikasi Logika Mata Kuliah Ikhwan/Akhwat:");
  // Cari ID Course Fiqh Syafi'i (Ikhwan)
  const courses = global.mockSS.getSheetByName(CONFIG.SHEET_NAMES.COURSES).data;
  let ikhwanCourseId = null;
  let akhwatCourseId = null;

  courses.forEach(row => {
      if (row[1] === "Fiqh Syafi'i (Ikhwan)") ikhwanCourseId = row[0];
      if (row[1] === "Fiqh Syafi'i (Akhwat)") akhwatCourseId = row[0];
  });

  if (ikhwanCourseId && akhwatCourseId) {
      // Cek siapa yang enroll ke Ikhwan Course
      let maleWrong = false;
      let femaleWrong = false;

      // Map UserID -> Gender
      let userGender = {};
      users.forEach((u, i) => { if(i>0) userGender[u[0]] = u[6]; }); // u[0]=ID, u[6]=Gender

      enrollments.forEach((row, i) => {
          if (i === 0) return;
          if (row[2] === ikhwanCourseId) {
              if (userGender[row[1]] !== "Pria") femaleWrong = true;
          }
          if (row[2] === akhwatCourseId) {
              if (userGender[row[1]] !== "Wanita") maleWrong = true;
          }
      });

      if (!femaleWrong && !maleWrong) {
          console.log("✅ Validasi Gender Mata Kuliah Berhasil: Pria masuk Ikhwan, Wanita masuk Akhwat.");
      } else {
          console.error(`❌ Validasi Gender Gagal. Pria Salah Masuk: ${maleWrong}, Wanita Salah Masuk: ${femaleWrong}`);
      }
  }

  console.log("\n=== TEST SELESAI ===");
}

runTest();
