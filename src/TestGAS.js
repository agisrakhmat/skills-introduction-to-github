/**
 * Test Script for Google Apps Script Environment.
 * Usage: Open this file in GAS Editor, select 'runTests' function, and click Run.
 * Do NOT include 'require' statements here.
 */

function runTests() {
  console.log('Running Tests in GAS Environment...');

  // --- MOCKING SETUP (If needed, or run against real DB carefully) ---
  // To test safely without touching real sheets, we can temporarily mock functions.
  // However, in GAS, it's often better to test logic functions that don't call external services,
  // or use a separate "Test" Spreadsheet ID.

  // For this run, we will test the Pure Logic (Service.getPredicate) and structure.
  // Testing DB interaction requires real sheets.

  // 1. Test Config Loading
  _assert(Config.MIN_PASS_AVERAGE === 60, 'Min Pass Average should be 60');
  console.log('✓ Config Loaded');

  // 2. Test Predicate Logic
  _assert(Service.getPredicate(96) === 'Mumtaz', '96 should be Mumtaz');
  _assert(Service.getPredicate(85) === 'Jayyid Jiddan Murtafi', '85 should be Jayyid Jiddan Murtafi');
  _assert(Service.getPredicate(60) === 'Jayyid', '60 should be Jayyid');
  _assert(Service.getPredicate(50) === 'Rasib', '50 should be Rasib');
  console.log('✓ Predicate Logic Passed');

  // 3. Test Service.processGrades (Mocking Database for safety)
  // We save the original function to restore it later
  var originalGetUser = Database.getUserByNimAndPhone;
  var originalGetGrade = Database.getCourseGrade;
  var originalGetCert = Database.getCertificateLog;

  // Mocking
  Database.getUserByNimAndPhone = function(nim, phone) {
    if (nim === 'TEST_NIM' && phone === '628123456789') {
      return {
        nim: 'TEST_NIM',
        nama: 'Test User',
        program: 'Test Prog',
        angkatan: '2025',
        alamat: 'Test Address',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: new Date()
      };
    }
    return null;
  };

  Database.getCourseGrade = function(sheet, nim) {
    return 100; // All Mumtaz
  };

  Database.getCertificateLog = function(nim) {
    return null;
  };

  // Mock Generator to avoid creating real files
  var originalGenCert = Service.generateCertificate;
  Service.generateCertificate = function(user, score) {
    return "https://mock-url.com/cert.pdf";
  };

  try {
    // Run Test
    var result = Service.processGrades('TEST_NIM', '628123456789');
    _assert(result.status === 'success', 'Status should be success');
    _assert(result.data.status_kelulusan === true, 'Should pass');
    _assert(result.data.sertifikat_url === "https://mock-url.com/cert.pdf", 'Should return mock URL');
    console.log('✓ Service Logic Passed');

  } catch (e) {
    console.error('Test Failed: ' + e.toString());
  } finally {
    // RESTORE ORIGINALS
    Database.getUserByNimAndPhone = originalGetUser;
    Database.getCourseGrade = originalGetGrade;
    Database.getCertificateLog = originalGetCert;
    Service.generateCertificate = originalGenCert;
  }

  console.log('All Tests Completed.');
}

function _assert(condition, message) {
  if (!condition) {
    throw new Error('Assertion Failed: ' + message);
  }
}
