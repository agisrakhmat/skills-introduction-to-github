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
    console.log("=== Starting Dashboard Tests ===");
    Database.setupDatabase();

    // 1. Mock Data Setup
    console.log("Test: Setup Mock Data...");
    // Create a User
    const userRow = { NIM: "DI.IN.25.01.RGR.0001", Nama: "Ahmad", Email: "ahmad@test.com", NoWA: "08123", Status_Aktif: "Aktif" };
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, userRow);

    // Create a Course
    const mkRow = { Kode_MK: "MK.01.FIQ", Nama_MK: "Fiqih Ibadah", SKS: 2, Mustawa: "01" };
    Database.insertRow(Config.SHEETS.MATAKULIAH, mkRow);

    // Create Grade
    const gradeRow = { NIM: "DI.IN.25.01.RGR.0001", Kode_MK: "MK.01.FIQ", Nilai_Akhir: 85 };
    Database.insertRow(Config.SHEETS.NILAI, gradeRow);

    // Create Schedule
    const schedRow = { Kode_MK: "MK.01.FIQ", Hari: "Senin", Jam_Mulai: "08:00", Jam_Selesai: "10:00" };
    Database.insertRow(Config.SHEETS.JADWAL, schedRow);

    // 2. Test Get Dashboard Stats
    console.log("Test: Get Stats...");
    const reqStats = { parameter: { action: "get_student_dashboard_data", user_id: "DI.IN.25.01.RGR.0001" } };
    const resStats = JSON.parse(Main.doGet(reqStats).getContent());
    console.log("Stats Res:", resStats);
    assert(resStats.success, "Get Stats should succeed");
    assert(resStats.data.profile.email === "ahmad@test.com", "Email should match");
    console.log("PASS: Stats");

    // 3. Test Get Grades
    console.log("Test: Get Grades...");
    const reqGrades = { parameter: { action: "get_grades", user_id: "DI.IN.25.01.RGR.0001" } };
    const resGrades = JSON.parse(Main.doGet(reqGrades).getContent());
    console.log("Grades Res:", resGrades);
    assert(resGrades.data.length === 1, "Should return 1 grade");
    assert(resGrades.data[0].letter_grade === "B", "85 Should be B (Jayyid Jiddan)");
    console.log("PASS: Grades");

    // 4. Test Get Schedules
    console.log("Test: Get Schedules...");
    const reqSched = { parameter: { action: "get_schedules", user_id: "DI.IN.25.01.RGR.0001" } };
    const resSched = JSON.parse(Main.doGet(reqSched).getContent());
    assert(resSched.data.length === 1, "Should return 1 schedule");
    assert(resSched.data[0].day === "Senin", "Day should match");
    console.log("PASS: Schedules");

    console.log("=== All Dashboard Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
