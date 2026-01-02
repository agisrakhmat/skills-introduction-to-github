/**
 * test_auth.js
 * Script Node.js lokal untuk memverifikasi Fitur Login Backend.
 */

const Security = require('../src/Security.gs');
const AuthController = require('../src/Controllers/AuthController.gs');
const CONFIG = require('../src/Config.gs');

// --- MOCKING GAS SERVICES FOR AUTH ---
// Kita perlu mock SpreadsheetApp agar AuthController bisa membaca data User dummy.

// 1. Mock Data User (sesuai yang di-seed di DatabaseSetup)
const MOCK_USERS_DATA = [
    // Header
    ["User_ID", "NIM", "Email", "Password_Hash", "Full_Name", "TTL", "Gender", "Address", "Phone", "Old_NIM", "Status_S1", "Role", "Status", "Batch", "Bank_Account", "Created_By", "Created_At"],
    // Data Student 1
    ["U-0001", "DI.IN.25.07.RGR.0001", "student1@diplomailmi.com", "HASH1234", "Mahasiswa Pria 1", "Jakarta", "Pria", "Alamat", "628123456781", "-", "-", "STUDENT", "ACTIVE", "07", "BCA", "SYS", "DATE"]
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
    // Simple mock digest returning array of bytes
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(str).digest();
    return Array.from(hash); // Convert Buffer to array for the loop in Security.gs
  },
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  base64Encode: (str) => Buffer.from(str).toString('base64'),
  base64Decode: (str) => Buffer.from(str, 'base64'), // returns Buffer
  newBlob: (data) => ({ getDataAsString: () => data.toString() })
};

// --- RUN TESTS ---

function runAuthTest() {
  console.log("=== MEMULAI TEST AUTENTIKASI (LOGIN) ===");

  // Test Case 1: Login Sukses (Email & Password Benar - Dummy Logic)
  console.log("\n1. Test Login Sukses (Student 1)...");
  const result1 = AuthController.login({
      emailOrPhone: "student1@diplomailmi.com",
      password: "1234" // Sesuai logika bypass dummy di AuthController
  });

  if (result1.success) {
      console.log("✅ Login Berhasil.");
      console.log("   Token:", result1.token.substring(0, 20) + "...");
      console.log("   User:", result1.user.full_name);
  } else {
      console.error("❌ Login Gagal:", result1.message);
  }

  // Test Case 2: Login Gagal (Password Salah)
  console.log("\n2. Test Login Gagal (Password Salah)...");
  const result2 = AuthController.login({
      emailOrPhone: "student1@diplomailmi.com",
      password: "WRONG_PASSWORD"
  });

  if (!result2.success) {
      console.log("✅ Login Gagal sesuai ekspektasi.");
  } else {
      console.error("❌ Login Seharusnya Gagal tapi Berhasil.");
  }

  // Test Case 3: Login Gagal (User Tidak Ditemukan)
  console.log("\n3. Test Login Gagal (User Tidak Ditemukan)...");
  const result3 = AuthController.login({
      emailOrPhone: "unknown@user.com",
      password: "1234"
  });

  if (!result3.success) {
      console.log("✅ Login Gagal (User Not Found) sesuai ekspektasi.");
  } else {
      console.error("❌ Login Seharusnya Gagal tapi Berhasil.");
  }

  // Test Case 4: Validasi Token
  console.log("\n4. Test Validasi Token...");
  if (result1.success) {
      const decoded = Security.validateToken(result1.token);
      if (decoded && decoded.uid === "U-0001") {
          console.log("✅ Token Valid & Payload Benar (UID: U-0001).");
      } else {
          console.error("❌ Token Tidak Valid.");
      }
  }

  console.log("\n=== TEST AUTH SELESAI ===");
}

runAuthTest();
