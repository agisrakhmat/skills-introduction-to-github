
// TEST RUNNER
require('./mock_gas.js');
var Main = require('../src/Main.js');
var Setup = require('../src/Setup.js');

console.log("=== STARTING TESTS ===");

// 1. SETUP
console.log("\n[TEST] Setup Database...");
var setupRes = Main.doGet({ parameter: { action: 'setup' } });
console.log(JSON.parse(setupRes.getContent()).message);

// 2. REGISTER STUDENT
console.log("\n[TEST] Register Student...");
var regData = {
    action: 'register',
    nama_ktp: "Ahmad Fulan",
    email: "ahmad@ilmi.id",
    no_hp: "62812345678",
    password: "pass",
    tgl_lahir: "Jakarta, 01-01-2000",
    jenis_kelamin: "IN",
    alamat: "Jl. Merdeka",
    kode_status: "RGR",
    angkatan: "25"
};
var regRes = Main.doPost({ postData: { contents: JSON.stringify(regData) } });
var regJson = JSON.parse(regRes.getContent());
console.log("Register Result:", regJson);
var nim = regJson.data ? regJson.data.nim : null;

// 3. LOGIN
console.log("\n[TEST] Login Student...");
var loginRes = Main.doPost({ postData: { contents: JSON.stringify({ action: 'login', identifier: nim, password: "pass", role: 'Mahasiswa' }) } });
console.log("Login Result:", JSON.parse(loginRes.getContent()));

// 4. CREATE MK (By Admin/System - simulate create via doPost 'update_data')
console.log("\n[TEST] Create MK...");
var mkData = { action: 'update_data', type: 'mk', nama: 'Fiqih Muamalah', mustawa: '01', dosen: 'Ust Budi' };
console.log(JSON.parse(Main.doPost({ postData: { contents: JSON.stringify(mkData) } }).getContent()).message);

// 5. UPLOAD BUKTI (Finance)
console.log("\n[TEST] Upload Bukti...");
var uploadData = { action: 'upload_bukti', session_user_id: nim, type: 'Pendaftaran', amount: '150000', file_name: 'bukti.jpg', file_data: 'base64...' };
var upRes = Main.doPost({ postData: { contents: JSON.stringify(uploadData) } });
console.log("Upload Result:", JSON.parse(upRes.getContent()));

// 6. VERIFY PAYMENT (Finance Admin)
console.log("\n[TEST] Verify Payment...");
// Need transaction ID. In mock db, it's the first one.
var pending = JSON.parse(Main.doGet({ parameter: { action: 'get_pending_transactions' } }).getContent()).data;
if (pending.length > 0) {
    var trxId = pending[0].id;
    var verifData = { action: 'verify_payment', id: trxId, status: 'APPROVE', admin_id: 'ADMIN' };
    console.log(JSON.parse(Main.doPost({ postData: { contents: JSON.stringify(verifData) } }).getContent()).message);
} else {
    console.log("No pending transactions found!");
}

// 7. CHECK STUDENT STATUS (After Verify)
console.log("\n[TEST] Check Student Dashboard...");
var dashRes = Main.doGet({ parameter: { action: 'get_student_dashboard', user_id: nim } });
console.log("Dashboard Status:", JSON.parse(dashRes.getContent()).data.status);

// 8. GENERATE CERTIFICATE
console.log("\n[TEST] Generate Certificate...");
// Need valid looking ID 25+ chars
var certData = { action: 'generate_certificates_batch', level: 'Mustawa 1', template_url: 'http://docs.google.com/presentation/d/123456789012345678901234567890_TEMPLATE_ID_abc' };
console.log(JSON.parse(Main.doPost({ postData: { contents: JSON.stringify(certData) } }).getContent()).message);

// 9. PUBLIC CHECK CERTIFICATE
console.log("\n[TEST] Check Certificate Public...");
// Find cert number first
var certs = JSON.parse(Main.doGet({ parameter: { action: 'get_certificates_list' } }).getContent()).data;
if (certs.length > 0) {
    var certNo = certs[0].no;
    var checkRes = Main.doGet({ parameter: { action: 'check_certificate', code: certNo } });
    console.log("Check Result:", JSON.parse(checkRes.getContent()).data);
} else {
    console.log("No certificates found.");
}

console.log("\n=== TESTS COMPLETED ===");
