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
    console.log("=== Starting Dashboard V3.3 Tests ===");
    Database.setupDatabase();

    // 1. Mock Data Setup
    console.log("Test: Setup Mock Data...");
    const userRow = { NIM: "DI.IN.25.01.RGR.0001", Nama: "Ahmad", Email: "ahmad@test.com", NoWA: "08123", Status_Aktif: "Aktif" };
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, userRow);

    const mkRow = { Kode_MK: "MK.01.FIQ", Nama_MK: "Fiqih Ibadah", SKS: 2, Mustawa: "01" };
    Database.insertRow(Config.SHEETS.MATAKULIAH, mkRow);

    const schedRow = { Kode_MK: "MK.01.FIQ", Hari: "Senin", Jam_Mulai: "08:00", Jam_Selesai: "10:00" };
    Database.insertRow(Config.SHEETS.JADWAL, schedRow);

    // 2. Test Get Lectures (V3.3 Structure)
    console.log("Test: Get Lectures...");
    const reqLec = { parameter: { action: "get_lectures", user_id: "DI.IN.25.01.RGR.0001" } };
    const resLec = JSON.parse(Main.doGet(reqLec).getContent());

    // Frontend V3.3 expects: mk_code, name, meeting, date, time, teacher, status
    const l = resLec.data[0];
    assert(l.mk_code === "MK.01.FIQ", "mk_code missing");
    assert(l.name === "Fiqih Ibadah", "name missing");
    assert(l.date === "Senin", "date (day) missing");
    console.log("PASS: Lectures Structure");

    console.log("=== All Dashboard V3.3 Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
