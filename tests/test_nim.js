// tests/test_nim.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DB } = require('./MockGAS');

// Load GAS files
const srcDir = path.join(__dirname, '../src');
const content = fs.readFileSync(path.join(srcDir, 'Code.gs'), 'utf8');
vm.runInThisContext(content);

function initDB() {
  DB.sheets = {};
  setupDatabase(); // From Setup.gs inside Code.gs
}

function runTests() {
  console.log("Starting NIM Generator Tests...");
  initDB();

  // Test 1: Register Male Student
  console.log("\nTest 1: Register Male (IN)");
  var res1 = registerStudent("ali@test.com", "Ali", "081234567890", "Laki-laki", "RGR");
  console.log("Result 1:", res1);
  if (res1.success && res1.nim.startsWith("DI.IN.")) {
      console.log("PASS: Male NIM Generated: " + res1.nim);
  } else {
      console.log("FAIL: " + JSON.stringify(res1));
  }

  // Test 2: Register Female Student
  console.log("\nTest 2: Register Female (AT)");
  var res2 = registerStudent("fatimah@test.com", "Fatimah", "081234567891", "Wanita", "RGR");
  console.log("Result 2:", res2);
  if (res2.success && res2.nim.startsWith("DI.AT.")) {
      console.log("PASS: Female NIM Generated: " + res2.nim);
  } else {
      console.log("FAIL: " + JSON.stringify(res2));
  }

  // Test 3: Auto Increment check
  console.log("\nTest 3: Auto Increment (Male)");
  var res3 = registerStudent("budi@test.com", "Budi", "081234567892", "Laki-laki", "RGR");
  // Assuming Ali was 0001, Budi should be 0002 if year/batch same
  console.log("Result 3:", res3);
  if (res3.success && res3.nim.endsWith(".0002")) {
      console.log("PASS: Sequence Incremented: " + res3.nim);
  } else {
      console.log("FAIL: Sequence logic error. Got: " + res3.nim);
  }
}

runTests();
