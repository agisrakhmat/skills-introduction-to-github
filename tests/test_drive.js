// tests/test_drive.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DB } = require('./MockGAS');

// Load GAS files into global context
const srcDir = path.join(__dirname, '../src');
const files = ['Config.gs', 'DriveService.gs', 'Code.gs'];
// We just need these for the drive test, but DriveService uses DriveApp which is mocked globally.
// Code.gs uses DriveService.

files.forEach(file => {
  // Mock missing dependencies for Code.gs if any (like getData/login etc used in doPost but we test uploadFile)
  // We'll just load the specific files we need or mock the missing functions if they are called.
  // Actually, we should load all to be safe.
});

// Load ALL files to ensure dependencies exist
['Config.gs', 'Database.gs', 'Auth.gs', 'BusinessLogic.gs', 'Setup.gs', 'DriveService.gs', 'Code.gs'].forEach(file => {
    try {
        const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
        vm.runInThisContext(content);
    } catch (e) { console.error("Error loading " + file, e); }
});


function runTests() {
  console.log("Starting Drive Service Tests...");

  // Test direct function
  console.log("\nTest 1: saveFileToDrive");
  try {
      var url = saveFileToDrive("base64data", "image/png", "test.png", "folder-id");
      if (url === "https://drive.google.com/file/d/mock-file-id/view") {
          console.log("PASS: File saved and URL returned");
      } else {
          console.log("FAIL: URL mismatch");
      }
  } catch (e) {
      console.log("FAIL: Exception thrown", e);
  }
}

runTests();
