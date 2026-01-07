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
const Auth = require('../src/Auth');
const Finance = require('../src/Finance');
const Main = require('../src/Main');

async function runTests() {
    console.log("=== Starting Enrollment Tests ===");
    Database.setupDatabase();

    // 1. Test Register with Full Data
    console.log("Test: Register with Full Data...");
    const regData = {
        action: 'register',
        nama_ktp: "Siti Aminah",
        email: "siti@example.com",
        no_hp: "081299998888",
        tgl_lahir: "Jakarta, 01-01-2000",
        jenis_kelamin: "P", // Should map to AT
        alamat: "Jl. Sudirman No. 1",
        status_s1: "Bukan",
        nim_lama: "",
        angkatan: "07",
        kode_status: "RGR"
    };

    const regRes = Main.doPost({ postData: { contents: JSON.stringify(regData) } });
    const regJson = JSON.parse(regRes.getContent());
    console.log("Reg Response:", regJson);
    assert(regJson.success, "Registration should succeed");
    assert(regJson.data.nim.includes("DI.AT."), "Gender P should be AT");

    // 2. Test Enroll with File and Transaction Code Generation
    console.log("Test: Enroll with File & TransCode...");
    const enrollData = {
        action: 'enroll',
        user_id: regJson.data.nim,
        mustawa: "Mustawa 1",
        nominal_spp: 189000,
        nominal_infaq: 50000,
        file_base64: "data:image/jpeg;base64,aaaa",
        file_name: "bukti.jpg"
    };

    const enrollRes = Main.doPost({ postData: { contents: JSON.stringify(enrollData) } });
    const enrollJson = JSON.parse(enrollRes.getContent());
    console.log("Enroll Response:", enrollJson);
    assert(enrollJson.success, "Enrollment should succeed");

    // Verify Transaction Code
    const txId = enrollJson.data.transaction_id;
    console.log("Generated Trans ID:", txId);
    // Format: KEU.PFN.BB.CC.0001
    // "Pendaftaran" -> P, f, n -> PFN? Or P, a, n?
    // My Logic: P (0), f (5), n (10). -> PFN.
    assert(txId.startsWith("KEU."), "Should start with KEU");
    assert(txId.includes(".PFN."), "Should contain type code PFN for Pendaftaran");
    assert(txId.endsWith(".0001"), "Should be first sequence");

    // Check DB
    const trans = Database.getTable(Config.SHEETS.TRANSAKSI);
    assert(trans.length > 0, "Transaction should be recorded");
    assert(trans[0].Nominal == 239000, "Total nominal should match (189k+50k)");

    console.log("PASS: Full Registration Flow");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
