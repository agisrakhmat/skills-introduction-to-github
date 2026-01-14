// Mock Google Apps Script Services
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
                                    var row = ['DI.001', 'Test User', 14.2, 0, 0, 0, 0, 10, 50, 50, 100, 'Pass'];
                                    return [headers, row];
                                }
                                return [];
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

// Load the Deployment File
const fs = require('fs');
const path = require('path');
const deploymentCode = fs.readFileSync(path.join(__dirname, '../src/Deployment.gs'), 'utf8');

// Evaluate the code in global scope
eval(deploymentCode);

// --- TESTS ---
const assert = require('assert');

console.log('Running Deployment Logic Tests...');

// Test 1: getCourseGrade Priority Logic
// Scenario: 'Aqidah' sheet has headers. K is 'Nilai Akhir'.
// Student has 100 in K (Index 10) and 14.2 in C (Index 2).
// Logic should return 100 and meta should say "Priority K".

const gradeData = Database.getCourseGrade('Aqidah', 'DI.001');
console.log('Result:', gradeData);

assert.strictEqual(gradeData.score, 100, 'Should pick value from Column K (100)');
assert.ok(gradeData.meta.includes('Priority K'), 'Meta should indicate Priority K was used');

// Test 2: Process Grades
const result = Service.processGrades('DI.001', '628123');
console.log('Process Result Meta:', result.meta);

assert.strictEqual(result.status, 'success');
assert.ok(result.meta.debug_trace, 'Debug trace should be present');
assert.ok(result.meta.debug_trace[0].includes('Priority K'), 'Debug trace should log the column source');

console.log('✓ Deployment Logic Tests Passed');
