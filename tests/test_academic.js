const assert = require('assert');
require('./mock_gas'); // Global mocks (ContentService needs to be added here potentially?)
const Config = require('../src/Config');
const Database = require('../src/Database');
const Academic = require('../src/Academic');
const Main = require('../src/Main');

// Mock ContentService for Main.js
global.ContentService = {
    createTextOutput: (content) => ({
        setMimeType: (mime) => ({ content, mime, getContent: () => content })
    }),
    MimeType: { JSON: 'application/json' }
};

async function runTests() {
    console.log("=== Starting Academic & Main Tests ===");

    // Setup DB
    Database.setupDatabase();

    // 1. Test Grading Logic
    console.log("Test: Calculation Logic...");
    // Formula: (Absen * 15%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 40%)
    const score = Academic.calculateFinalScore(100, 80, 70, 60);
    // (15) + (12) + (21) + (24) = 72
    console.log(`Score: ${score}`);
    assert(Math.abs(score - 72) < 0.1, "Calculation should be correct");
    console.log("PASS: Calculation");

    // 2. Test Predicate Logic (Rasib vs Maqbul)
    console.log("Test: Predicate Boundary...");

    const p1 = Academic.determinePredicate(60);
    console.log(`Score 60: ${p1.predikat} (${p1.status})`);
    assert(p1.predikat === "Rasib" && p1.status === "LULUS", "60 Should be Rasib/LULUS");

    const p2 = Academic.determinePredicate(59.9);
    console.log(`Score 59.9: ${p2.predikat} (${p2.status})`);
    assert(p2.predikat === "Maqbul" && p2.status === "GAGAL", "59.9 Should be Maqbul/GAGAL");

    const p3 = Academic.determinePredicate(69);
    assert(p3.predikat === "Rasib", "69 Should be Rasib");

    const p4 = Academic.determinePredicate(70);
    assert(p4.predikat === "Jayyid", "70 Should be Jayyid");

    console.log("PASS: Predicate Logic");

    // 3. Test Attendance Submission via Main Router
    console.log("Test: Main doPost (Attendance)...");
    const req = {
        parameter: {
            action: "submit_presensi",
            nim: "DI.IN.25.07.RGR.0001",
            kode_mk: "MK.01.FIQ",
            pertemuan: 1,
            status: "Zoom" // Should be 100
        }
    };

    const resObj = Main.doPost(req);
    const res = JSON.parse(resObj.getContent());
    console.log("Attendance Response:", res);
    assert(res.success, "Attendance submission should succeed");
    assert(res.poin === 100, "Zoom should give 100 points");

    // Verify DB
    const presensiTable = Database.getTable(Config.SHEETS.PRESENSI);
    assert(presensiTable.length > 0, "Presensi data should be saved");
    assert(presensiTable[0].Poin === 100, "Saved point should be 100");
    console.log("PASS: Attendance Submission");

    // 4. Test Grading Process
    console.log("Test: Full Grading Process...");
    // NIM has 1 attendance (100). Let's calculate grade.
    // Avg Absen = 100.
    // Tugas=80, UTS=70, UAS=60 => Final=72 (Jayyid)
    const gradeRec = Academic.processFinalGrade("DI.IN.25.07.RGR.0001", "MK.01.FIQ", 80, 70, 60);
    console.log("Grade Record:", gradeRec);
    assert(gradeRec.Nilai_Akhir === 72, "Final Grade should be 72");
    assert(gradeRec.Predikat === "Jayyid", "Predicate should be Jayyid");
    assert(gradeRec.Status_Lulus === "LULUS", "Status should be LULUS");
    console.log("PASS: Full Grading Process");

    console.log("=== All Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
