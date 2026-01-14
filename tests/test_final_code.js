// Mock Google Apps Script Services for Final Verification
global.SpreadsheetApp = {
    flush: function() {},
    openById: function(id) {
        return {
            getSheetByName: function(name) {
                return {
                    getDataRange: function() {
                        return {
                            getValues: function() {
                                // Mock Data based on Scenario
                                if (name === 'data_user') {
                                    return [
                                        ['NIM', 'Nama', 'JK', 'Alamat', 'Program', 'HP', 'Angkatan', 'Tempat', 'Tgl'],
                                        ['DI.001', 'Test User', 'L', 'Jkt', 'DI', '628123', '07', 'Jkt', new Date()]
                                    ];
                                }
                                if (name === 'Aqidah') {
                                    // Mocking the headers from user screenshot
                                    // Index 0..10. K is 10.
                                    var headers = ['NIM', 'Nama', 'Absen(15%)', 'T1', 'T2', 'T3', 'T4', 'Rata(15%)', 'UTS', 'UAS', 'Nilai Akhir', 'Ket'];

                                    // Row 1: Student
                                    // Note: Index 2 (Absen) = 14.2
                                    // Note: Index 10 (Nilai Akhir) = 100
                                    var row = ['DI.001', 'Test User', 14.2, 0, 0, 0, 0, 10, 50, 50, 100, 'Pass'];
                                    return [headers, row];
                                }
                                // Return empty for other courses so average calculation works (0s)
                                return [['NIM'], ['DI.001']];
                            }
                        };
                    },
                    getLastRow: function() { return 1; },
                    appendRow: function() {}
                };
            }
        };
    }
};

global.DriveApp = {
    getFolderById: function() { return { createFile: function() { return { setName: function(){}, getUrl: function(){ return 'http://pdf'; } }; } }; },
    getFileById: function() { return { makeCopy: function() { return { getId: function(){}, getAs: function(){}, setTrashed: function(){} }; } }; }
};

global.SlidesApp = {
    openById: function() {
        return {
            getSlides: function() { return [{ replaceAllText: function(){} }]; },
            saveAndClose: function(){}
        };
    }
};

global.ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput: function(content) {
        return { setMimeType: function() { return content; } };
    }
};

global.Logger = { log: console.log };
global.MimeType = { PDF: 'application/pdf' }; // Add missing mock

// Load the Deployment File
const fs = require('fs');
const path = require('path');
const codeContent = fs.readFileSync(path.join(__dirname, '../src/Code.gs'), 'utf8');

// Evaluate the code in global scope
eval(codeContent);

// --- TESTS ---
const assert = require('assert');

console.log('Running Final Logic Tests...');

// Test 1: getGrade (Column K Check)
// Scenario: 'Aqidah' sheet. K (Index 10) = 100.
// Logic MUST return 100.

const score = Database.getGrade('Aqidah', 'DI.001');
console.log('Score retrieved:', score);

assert.strictEqual(score, 100, 'Must retrieve exactly 100 from Column K');

// Test 2: Process Request
const result = Service.processRequest('DI.001', '628123');
console.log('Process Result:', JSON.stringify(result.data.nilai[0]));

assert.strictEqual(result.status, 'success');
assert.strictEqual(result.data.nilai[0].mutu, 100);
assert.strictEqual(result.data.nilai[0].nilai, 'Mumtaz');

console.log('✓ Final Logic Tests Passed');
