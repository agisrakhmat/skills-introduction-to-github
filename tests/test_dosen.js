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
    console.log("=== Starting Dosen Tests ===");
    Database.setupDatabase();

    // 1. Mock Data Setup
    console.log("Test: Setup Mock Data...");
    // Dosen User (No need specific User Staff logic here if ID matches FK)
    const dosenId = "DI.DS.001";

    // Create Courses
    const mk1 = { Kode_MK: "MK.01.FIQ", Nama_MK: "Fiqih 1", Mustawa: "01", Dosen_Pengampu: dosenId };
    const mk2 = { Kode_MK: "MK.02.USH", Nama_MK: "Ushul Fiqih", Mustawa: "02", Dosen_Pengampu: "DI.DS.999" };
    Database.insertRow(Config.SHEETS.MATAKULIAH, mk1);
    Database.insertRow(Config.SHEETS.MATAKULIAH, mk2);

    // Create Students
    const s1 = { NIM: "DI.IN.25.01.RGR.0001", Nama: "Budi", Status_Aktif: "Aktif", Mustawa_Saat_Ini: "01" };
    const s2 = { NIM: "DI.AT.25.01.RGR.0002", Nama: "Siti", Status_Aktif: "Aktif", Mustawa_Saat_Ini: "01" };
    const s3 = { NIM: "DI.IN.25.02.RGR.0003", Nama: "Anto", Status_Aktif: "Aktif", Mustawa_Saat_Ini: "02" }; // Diff Mustawa
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, s1);
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, s2);
    Database.insertRow(Config.SHEETS.USERS_MAHASISWA, s3);

    // 2. Test Get Dosen Courses
    console.log("Test: Get Dosen Courses...");
    const req1 = { parameter: { action: "get_dosen_mk", user_id: dosenId } };
    const res1 = JSON.parse(Main.doGet(req1).getContent());
    assert(res1.success, "Get MK Success");
    assert(res1.data.length === 1, "Should return 1 course");
    assert(res1.data[0].course_id === "MK.01.FIQ", "Course ID Match");
    console.log("PASS: Get Courses");

    // 3. Test Get Enrolled Students
    console.log("Test: Get Enrolled Students...");
    const req2 = { parameter: { action: "get_enrolled_students", course_id: "MK.01.FIQ", mustawa: "01" } };
    const res2 = JSON.parse(Main.doGet(req2).getContent());
    assert(res2.success, "Get Students Success");
    assert(res2.data.length === 2, "Should return 2 students (Budi & Siti)");
    assert(res2.data.find(s => s.name === "Budi"), "Budi found");
    console.log("PASS: Get Students");

    // 4. Test Submit Bulk Attendance
    console.log("Test: Submit Attendance...");
    const attData = [
        { nim: "DI.IN.25.01.RGR.0001", status: "Hadir" },
        { nim: "DI.AT.25.01.RGR.0002", status: "Izin" }
    ];
    const req3 = { postData: { contents: JSON.stringify({
        action: "submit_bulk_attendance",
        course_id: "MK.01.FIQ",
        pertemuan: 1,
        data: attData
    })}};
    const res3 = JSON.parse(Main.doPost(req3).getContent());
    assert(res3.success, "Submit Att Success");

    // Verify DB
    const presensi = Database.getTable(Config.SHEETS.PRESENSI);
    assert(presensi.length === 2, "2 Attendance records saved");
    assert(presensi[0].Poin == 100, "Hadir = 100");
    assert(presensi[1].Poin == 60, "Izin = 60");
    console.log("PASS: Submit Attendance");

    // 5. Test Submit Bulk Grades
    console.log("Test: Submit Grades...");
    const gradeData = [
        { nim: "DI.IN.25.01.RGR.0001", tugas: 80, uts: 90, uas: 95 }
    ];
    const req4 = { postData: { contents: JSON.stringify({
        action: "submit_bulk_grades",
        course_id: "MK.01.FIQ",
        data: gradeData
    })}};
    const res4 = JSON.parse(Main.doPost(req4).getContent());
    assert(res4.success, "Submit Grade Success");

    const grades = Database.getTable(Config.SHEETS.NILAI);
    assert(grades.length === 1, "1 Grade saved");
    assert(grades[0].Nilai_Akhir == 92, "Final Score Calc");
    assert(grades[0].Predikat === "Mumtaz", "Predicate Check");
    console.log("PASS: Submit Grades");

    console.log("=== All Dosen Tests Passed ===");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
