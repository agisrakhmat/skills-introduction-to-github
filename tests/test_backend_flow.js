// tests/test_backend_flow.js
const Code = require('../src/Code');
const Database = require('../src/Database');
const Service = require('../src/Service');
const Config = require('../src/Config');

// --- MOCKS ---
// Mock SpreadsheetApp
global.SpreadsheetApp = {
    openById: (id) => ({
        getSheetByName: (name) => {
            if (name === Config.SHEET_USER) {
                return {
                    getDataRange: () => ({
                        getValues: () => [
                            // Header
                            ['NIM', 'Nama', 'JK', 'Alamat', 'Program', 'Nomor Telepon', 'Angkatan', 'Tempat Lahir', 'Tanggal Lahir'],
                            // Row 1: Valid User
                            ['DI.AT.25.07.ADM.0011', 'Test User', 'P', 'Bogor', 'Mustawa 1', '6285606215619', '07', 'Bogor', new Date('1998-08-19')],
                            // Row 2: User with 08 format
                            ['DI.AT.TEST.08', 'Test 08', 'L', 'Jkt', 'Mustawa 1', '08123456789', '07', 'Jkt', '1990-01-01']
                        ]
                    })
                };
            }
            if (Config.SHEET_COURSES.includes(name)) {
                return {
                    getDataRange: () => ({
                        getValues: () => [
                            ['NIM', 'Nama', '...', '...', '...', '...', '...', '...', '...', '...', 'Nilai Akhir'],
                            ['DI.AT.25.07.ADM.0011', 'Test User', '', '', '', '', '', '', '', '', 90], // K=Index 10
                            ['DI.AT.TEST.08', 'Test 08', '', '', '', '', '', '', '', '', 50]
                        ]
                    })
                };
            }
            if (name === Config.SHEET_CERTIFICATE) {
                return {
                    getDataRange: () => ({
                        getValues: () => [['Nomor', 'NIM', 'Nama', 'Timestamp', 'URL']], // Only Header
                    }),
                    getLastRow: () => 1,
                    appendRow: (row) => console.log('Mock Append Row:', row)
                };
            }
            return null; // Missing sheet
        }
    })
};

// Mock DriveApp
global.DriveApp = {
    getFileById: (id) => ({
        makeCopy: (name, folder) => ({
            getId: () => 'mock_copy_id',
            setTrashed: (bool) => {},
            getAs: (mime) => 'mock_blob'
        })
    }),
    getFolderById: (id) => ({
        createFile: (blob) => ({
            setName: (n) => {},
            getUrl: () => 'https://drive.google.com/file/d/mock_pdf_id'
        })
    })
};

// Mock SlidesApp
global.SlidesApp = {
    openById: (id) => ({
        getSlides: () => [{
            replaceAllText: (find, replace) => console.log(`Slide Replace: "${find}" -> "${replace}"`)
        }],
        saveAndClose: () => {}
    })
};

global.MimeType = { PDF: 'application/pdf' };
global.ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput: (str) => ({ setMimeType: () => str })
};

// --- TESTS ---

function runTests() {
    console.log('--- START TESTING ---');

    // 1. Test User Lookup (Clean Phone)
    console.log('\nTest 1: User Lookup (Valid Phone 62)');
    let res1 = Code.doGet({ parameter: { nim: 'DI.AT.25.07.ADM.0011', phone: '085606215619' } }); // Input 08, DB has 62
    let json1 = JSON.parse(res1);
    if (json1.status === 'success' && json1.data.nim === 'DI.AT.25.07.ADM.0011') {
        console.log('PASS: User found with 08->62 conversion.');
    } else {
        console.error('FAIL:', json1);
    }

    // 2. Test Grading Logic (Pass)
    console.log('\nTest 2: Grading Logic (Pass)');
    // User 1 has 90 in all subjects (mocked same for all courses). Avg 90.
    if (json1.data.status_kelulusan === true && json1.data.sertifikat_url.includes('mock_pdf_id')) {
        console.log('PASS: Graduated and Cert URL generated.');
    } else {
        console.error('FAIL: Status:', json1.data.status_kelulusan, 'URL:', json1.data.sertifikat_url);
    }

    // 3. Test Grading Logic (Fail)
    console.log('\nTest 3: Grading Logic (Fail)');
    let res2 = Code.doGet({ parameter: { nim: 'DI.AT.TEST.08', phone: '08123456789' } });
    let json2 = JSON.parse(res2);
    // User 2 has 50 in all subjects. Avg 50. < 60.
    if (json2.data.status_kelulusan === false && json2.data.sertifikat_url === '') {
        console.log('PASS: Not Graduated and No Cert URL.');
    } else {
        console.error('FAIL:', json2.data);
    }

    // 4. Test User Not Found
    console.log('\nTest 4: User Not Found');
    let res3 = Code.doGet({ parameter: { nim: 'INVALID', phone: '00000' } });
    let json3 = JSON.parse(res3);
    if (json3.status === 'error' && json3.message.includes('Data Tidak Ditemukan')) {
        console.log('PASS: Error message correct.');
    } else {
        console.error('FAIL:', json3);
    }

    console.log('\n--- END TESTING ---');
}

runTests();
