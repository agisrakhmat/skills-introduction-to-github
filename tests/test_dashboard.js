// Mock DriveApp for testing Finance.js
global.DriveApp = {
    getFolderById: (id) => ({
        createFile: (blob) => ({
            setSharing: () => {},
            getUrl: () => "https://mock-drive.google.com/file/" + blob.name
        })
    }),
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
    Permission: { VIEW: 'VIEW' }
};

// Mock ContentService for Main.js
global.ContentService = {
    createTextOutput: (content) => ({
        setMimeType: (mime) => ({ content, mime, getContent: () => content })
    }),
    MimeType: { JSON: 'application/json' }
};

const assert = require('assert');
require('./mock_gas');
const Config = require('../src/Config');
const Database = require('../src/Database');
const Main = require('../src/Main');

async function runTests() {
    console.log("=== Starting Dashboard V3 Tests ===");
    Database.setupDatabase();

    // 1. Mock Data Setup
    console.log("Test: Setup Mock Data...");
    const userRow = { NIM: "DI.IN.25.01.RGR.0001", Nama: "Ahmad", Email: "ahmad@test.com", NoWA: "08123", Status_Aktif: "Aktif" };
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, userRow);

    const mkRow = { Kode_MK: "MK.01.FIQ", Nama_MK: "Fiqih Ibadah", SKS: 2, Mustawa: "01" };
    Database.insertRow(Config.SHEETS.MATAKULIAH, mkRow);

    // Grade: 85 (B)
    const gradeRow = { NIM: "DI.IN.25.01.RGR.0001", Kode_MK: "MK.01.FIQ", Nilai_Akhir: 85 };
    Database.insertRow(Config.SHEETS.NILAI, gradeRow);

    // Schedule: Monday 08:00
    const schedRow = { Kode_MK: "MK.01.FIQ", Hari: "Senin", Jam_Mulai: "08:00", Jam_Selesai: "10:00" };
    Database.insertRow(Config.SHEETS.JADWAL, schedRow);

    // 2. Test Get Grades (V3 Key Check)
    console.log("Test: Get Grades (V3 Keys)...");
    const reqGrades = { parameter: { action: "get_grades", user_id: "DI.IN.25.01.RGR.0001" } };
    const resGrades = JSON.parse(Main.doGet(reqGrades).getContent());

    // Frontend V3 expects: course, sks, score, grade
    const g = resGrades.data[0];
    assert(g.course === "Fiqih Ibadah", "Key 'course' missing or wrong");
    assert(g.score == 85, "Key 'score' missing or wrong");
    assert(g.grade === "B", "Key 'grade' missing or wrong");
    console.log("PASS: Grades Keys");

    // 3. Test Get Schedules (Status Logic)
    console.log("Test: Get Schedules (Live Status)...");
    const reqSched = { parameter: { action: "get_schedules", user_id: "DI.IN.25.01.RGR.0001" } };
    const resSched = JSON.parse(Main.doGet(reqSched).getContent());
    const s = resSched.data[0];
    assert(s.status === "upcoming" || s.status === "live" || s.status === "done", "Status key missing");
    console.log("PASS: Schedules Status");

    // 4. Test Upload Bukti (Recurring Payment)
    console.log("Test: Upload Bukti...");
    const reqUpload = { postData: { contents: JSON.stringify({
        action: "upload_bukti",
        session_user_id: "DI.IN.25.01.RGR.0001",
        type: "SPP",
        amount: 250000,
        file_data: "data:image/png;base64,abc",
        file_name: "spp.jpg"
    })}};
    const resUpload = JSON.parse(Main.doPost(reqUpload).getContent());
    assert(resUpload.success, "Upload should succeed");

    // Check DB
    const trans = Database.getTable(Config.SHEETS.TRANSAKSI);
    const lastTrans = trans[trans.length-1];
    assert(lastTrans.Jenis_Transaksi === "SPP", "Transaction Type saved");
    assert(lastTrans.Nominal == 250000, "Nominal saved");
    console.log("PASS: Upload Bukti");

    console.log("=== All Dashboard V3 Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
