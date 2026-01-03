const assert = require('assert');
const Config = require('../src/Config');
const Database = require('../src/Database');
const Service = require('../src/Service');
const Code = require('../src/Code');

// --- SETUP MOCKS ---
// Mock Database Data
Database._mockDataUser = [
  {
    nim: 'DI.AT.25.07.RGR.0001',
    nama: 'Fulan Bin Fulan',
    jenis_kelamin: 'L',
    alamat: 'Jakarta',
    program: 'Diploma Ilmi',
    phone: '628123456789',
    angkatan: '07',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: new Date('1990-01-01')
  },
  {
    nim: 'DI.AT.25.07.RGR.0002', // Failed student
    nama: 'Fulanah',
    jenis_kelamin: 'P',
    alamat: 'Bogor',
    program: 'Diploma Ilmi',
    phone: '628987654321',
    angkatan: '07',
    tempat_lahir: 'Bogor',
    tanggal_lahir: '02/02/1995'
  }
];

// Mock Grades
// Student 1: All Mumtaz (100)
Database._mockGrades['Aqidah'] = { 'DI.AT.25.07.RGR.0001': 100, 'DI.AT.25.07.RGR.0002': 50 };
Database._mockGrades['Dakwah'] = { 'DI.AT.25.07.RGR.0001': 95, 'DI.AT.25.07.RGR.0002': 50 };
Database._mockGrades["Fiqih Syafi'i"] = { 'DI.AT.25.07.RGR.0001': 90, 'DI.AT.25.07.RGR.0002': 50 };
Database._mockGrades['Fiqih Waris'] = { 'DI.AT.25.07.RGR.0001': 85, 'DI.AT.25.07.RGR.0002': 50 };
Database._mockGrades['Nahwu'] = { 'DI.AT.25.07.RGR.0001': 80, 'DI.AT.25.07.RGR.0002': 50 };

// --- TESTS ---

console.log('Running Tests...');

// 1. Test Config Loading
assert.strictEqual(Config.MIN_PASS_AVERAGE, 60, 'Min Pass Average should be 60');

// 2. Test Predicate Logic
assert.strictEqual(Service.getPredicate(96), 'Mumtaz');
assert.strictEqual(Service.getPredicate(85), 'Jayyid Jiddan Murtafi');
assert.strictEqual(Service.getPredicate(80), 'Jayyid Jiddan');
assert.strictEqual(Service.getPredicate(75), "Jayyid Murtafi'");
assert.strictEqual(Service.getPredicate(60), 'Jayyid');
assert.strictEqual(Service.getPredicate(50), 'Rasib');
console.log('✓ Predicate Logic Passed');

// 3. Test Database Mock - Get User
const user1 = Database.getUserByNimAndPhone('DI.AT.25.07.RGR.0001', '08123456789'); // Phone without 62 prefix
assert.ok(user1, 'User 1 should be found');
assert.strictEqual(user1.nama, 'Fulan Bin Fulan');

const userFail = Database.getUserByNimAndPhone('DI.AT.25.07.RGR.0001', '000000'); // Wrong phone
assert.strictEqual(userFail, null, 'User should not be found with wrong phone');
console.log('✓ Database User Fetch Passed');

// 4. Test Service - Process Grades (Success Case)
const resultSuccess = Service.processGrades('DI.AT.25.07.RGR.0001', '628123456789');
assert.strictEqual(resultSuccess.status, 'success');
assert.strictEqual(resultSuccess.data.status_kelulusan, true);
assert.ok(resultSuccess.data.sertifikat_url, 'Certificate URL should be generated');
assert.strictEqual(resultSuccess.data.nilai.length, 5);
assert.strictEqual(resultSuccess.data.nilai[0].nilai, 'Mumtaz');
console.log('✓ Service Grade Process (Success) Passed');

// 5. Test Service - Process Grades (Fail Case)
const resultFail = Service.processGrades('DI.AT.25.07.RGR.0002', '628987654321');
assert.strictEqual(resultFail.status, 'success');
assert.strictEqual(resultFail.data.status_kelulusan, false);
assert.strictEqual(resultFail.data.sertifikat_url, '', 'Certificate URL should be empty for failed student');
console.log('✓ Service Grade Process (Fail) Passed');

// 6. Test Code.doGet
const e = { parameter: { nim: 'DI.AT.25.07.RGR.0001', phone: '628123456789' } };
const jsonResponse = Code.doGet(e);
const responseObj = JSON.parse(jsonResponse);
assert.strictEqual(responseObj.status, 'success');
assert.strictEqual(responseObj.data.nama, 'Fulan Bin Fulan');
console.log('✓ API Entry Point (doGet) Passed');

console.log('All tests passed!');
