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

    // Create Announcement
    const annRow = { Kode_Pengumuman: "KES.INF.25.01.001", Judul: "Libur Awal Ramadhan", Isi_Pesan: "Libur mulai tgl 1", Target_Role: "Mahasiswa", Tgl_Terbit: "2025-02-20" };
    Database.insertRow(Config.SHEETS.PENGUMUMAN, annRow);

    // 2. Test Get Dashboard Stats
    console.log("Test: Get Stats...");
    const reqStats = { parameter: { action: "get_student_dashboard_data", user_id: "DI.IN.25.01.RGR.0001" } };
    const resStats = JSON.parse(Main.doGet(reqStats).getContent());
    assert(resStats.success, "Get Stats should succeed");
    console.log("PASS: Stats");

    // 3. Test Get Announcements
    console.log("Test: Get Announcements...");
    const reqAnn = { parameter: { action: "get_announcements" } };
    const resAnn = JSON.parse(Main.doGet(reqAnn).getContent());
    console.log("Ann Res:", resAnn);
    assert(resAnn.success, "Get Announcements should succeed");
    assert(resAnn.data.length > 0, "Should return announcements");
    assert(resAnn.data[0].title === "Libur Awal Ramadhan", "Title should match");
    console.log("PASS: Announcements");

    console.log("=== All Dashboard Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
