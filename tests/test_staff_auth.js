/**
 * test_staff_auth.js
 * Script Node.js lokal untuk memverifikasi Fitur Login STAFF (Admin, Finance, Dosen).
 */

const AuthController = require('../src/Controllers/AuthController.gs');
const CONFIG = require('../src/Config.gs');

// --- MOCKING GAS SERVICES FOR AUTH ---
// Kita perlu mock SpreadsheetApp agar AuthController bisa membaca data User dummy (termasuk staff).

// 1. Mock Data User (Menggabungkan Student + Staff sesuai logika seeding yang baru)
const MOCK_USERS_DATA = [
    // Header
    ["User_ID", "NIM", "Email", "Password_Hash", "Full_Name", "TTL", "Gender", "Address", "Phone", "Old_NIM", "Status_S1", "Role", "Status", "Batch", "Bank_Account", "Created_By", "Created_At"],
    // Data Student 1
    ["U-0001", "DI.IN.25.07.RGR.0001", "student1@diplomailmi.com", "HASH1234", "Mahasiswa Pria 1", "Jakarta", "Pria", "Alamat", "628123456781", "-", "-", "STUDENT", "ACTIVE", "07", "BCA", "SYS", "DATE"],
    // Data Staff (Added manually here to simulate what seedDummyData does)
    ["ADM-001", "ADM-001", "admin@diplomailmi.com", "HASH1234", "Super Admin", "Jakarta", "Pria", "Jl. Staff", "62899999999", "-", "-", "ADMIN", "ACTIVE", "-", "BSI", "SYS", "DATE"],
    ["FIN-001", "FIN-001", "finance@diplomailmi.com", "HASH1234", "Staff Keuangan", "Jakarta", "Pria", "Jl. Staff", "62899999999", "-", "-", "FINANCE", "ACTIVE", "-", "BSI", "SYS", "DATE"]
];

// 2. Mock Classes
class MockSheet {
  getDataRange() { return this; }
  getValues() { return MOCK_USERS_DATA; }
}
class MockSpreadsheet {
  getSheetByName(name) {
    if (name === CONFIG.SHEET_NAMES.USERS) return new MockSheet();
    return null;
  }
}

// Global Mocks
global.SpreadsheetApp = {
  openById: (id) => new MockSpreadsheet(id)
};
global.Utilities = {
  computeDigest: (algo, str) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(str).digest();
    return Array.from(hash);
  },
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  base64Encode: (str) => Buffer.from(str).toString('base64'),
  base64Decode: (str) => Buffer.from(str, 'base64'),
  newBlob: (data) => ({ getDataAsString: () => data.toString() })
};

// --- RUN TESTS ---

function runStaffAuthTest() {
  console.log("=== MEMULAI TEST AUTENTIKASI (STAFF LOGIN) ===");

  // Test Case 1: Login Sukses Admin
  console.log("\n1. Test Login Admin...");
  const result1 = AuthController.login({
      emailOrPhone: "admin@diplomailmi.com",
      password: "1234"
  });

  if (result1.success && result1.user.role === 'ADMIN') {
      console.log("✅ Login Admin Berhasil.");
      console.log("   Role:", result1.user.role);
  } else {
      console.error("❌ Login Admin Gagal:", result1.message);
  }

  // Test Case 2: Login Sukses Finance
  console.log("\n2. Test Login Finance...");
  const result2 = AuthController.login({
      emailOrPhone: "finance@diplomailmi.com",
      password: "1234"
  });

  if (result2.success && result2.user.role === 'FINANCE') {
      console.log("✅ Login Finance Berhasil.");
      console.log("   Role:", result2.user.role);
  } else {
      console.error("❌ Login Finance Gagal:", result2.message);
  }

  console.log("\n=== TEST STAFF AUTH SELESAI ===");
}

runStaffAuthTest();
