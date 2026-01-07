const assert = require('assert');
require('./mock_gas'); // Load global mocks
const Config = require('../src/Config');
const Database = require('../src/Database');
const Users = require('../src/Users');
const Auth = require('../src/Auth');

// Test Suite
async function runTests() {
    console.log("=== Starting Tests ===");

    // 1. Setup Mock DB
    console.log("Test: Setup Database...");
    Database.setupDatabase();

    // Verify sheets exist
    const ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    assert(ss.getSheetByName(Config.SHEETS.USERS_MAHASISWA), "Users sheet should exist");
    assert(ss.getSheetByName(Config.SHEETS.NILAI), "Nilai sheet should exist");
    console.log("PASS: Database Setup");

    // 2. Test Registration (Success)
    console.log("Test: Student Registration...");
    const studentData = {
        Nama: "Ahmad Fulan",
        Email: "ahmad@example.com",
        NoWA: "081234567890",
        Gender: "Laki-laki",
        Status: "RGR",
        AngkatanCode: "07"
    };

    const regResult = Auth.registerStudent(studentData);
    console.log("Register Result:", regResult);
    assert(regResult.success, "Registration should succeed");
    assert(regResult.data.NIM.includes("DI.IN."), "NIM should have correct prefix");
    assert(regResult.data.Password === "7890", "Default password should be last 4 digits");
    console.log("PASS: Registration");

    // 3. Test Duplicate Registration (Fail)
    console.log("Test: Duplicate Check...");
    const regResult2 = Auth.registerStudent(studentData);
    assert(!regResult2.success, "Duplicate registration should fail");
    console.log("PASS: Duplicate Check");

    // 4. Test NIM Increment
    console.log("Test: NIM Increment...");
    const studentData2 = { ...studentData, Email: "budi@example.com", NoWA: "081234560000" };
    const regResult3 = Auth.registerStudent(studentData2);

    // Expecting ...0002
    const nim1 = regResult.data.NIM;
    const nim2 = regResult3.data.NIM;
    console.log(`NIM 1: ${nim1}, NIM 2: ${nim2}`);

    const seq1 = parseInt(nim1.split('.').pop());
    const seq2 = parseInt(nim2.split('.').pop());
    assert(seq2 === seq1 + 1, "NIM sequence should increment");
    console.log("PASS: NIM Increment");

    // 5. Test Login (Success)
    console.log("Test: Login...");
    const loginRes = Auth.login("ahmad@example.com", "7890", Config.ROLES.MAHASISWA);
    assert(loginRes.success, "Login should succeed with correct password");
    assert(loginRes.user.id === nim1, "Login should return correct NIM");
    console.log("PASS: Login Success");

    // 6. Test Login (Fail)
    const loginFail = Auth.login("ahmad@example.com", "wrongpass", Config.ROLES.MAHASISWA);
    assert(!loginFail.success, "Login should fail with wrong password");
    console.log("PASS: Login Fail");

    console.log("=== All Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
