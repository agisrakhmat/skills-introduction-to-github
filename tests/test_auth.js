// tests/test_auth.js

// Load mocks
var Mocks = require('./mock_gas');

// Load Source Files
var Config = require('../src/Config');
var Utils = require('../src/Utils');
var Database = require('../src/Database');
var Auth = require('../src/Auth');
var Code = require('../src/Code');

// Helper to run assertions
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('PASS: ' + message);
  }
}

// Test Suite
console.log('Running Tests...');

// 1. Test Setup Database
console.log('\nTest: Database Setup');
Mocks.resetMocks();
Code.manualSetup();
var data = Mocks.getMockData();
assert(data[Config.SHEET_USERS], 'Users sheet created');
assert(data[Config.SHEET_COURSES], 'Courses sheet created');
assert(data[Config.SHEET_USERS][0][0] === 'user_id', 'Users header correct');

// 2. Test Registration
console.log('\nTest: Registration');
var req = {
  parameter: {
    action: 'register',
    email: 'student@test.com',
    full_name: 'Test Student',
    phone: '6281234567890',
    role: 'STUDENT'
  }
};
var res = JSON.parse(Code.doPost(req).getContent());
assert(res.success === true, 'Registration success');
assert(data[Config.SHEET_USERS].length === 2, 'User added to sheet'); // Header + 1 user
var registeredUser = data[Config.SHEET_USERS][1];
assert(registeredUser[1] === 'student@test.com', 'Email correct');
assert(registeredUser[3] === '6281234567890', 'Phone correct');
// Password check (last 4 digits of phone) -> 7890
// Hash of 7890 mocked
// In real node env utils uses crypto, in gas mock uses mock
// Let's verify utils uses the crypto/mock correctly
// Utils in node (this test) uses crypto or mock if crypto fails.
// Since we are mocking Utilities in global, Utils might pick that up if isGas() returns true?
// Utils.isGas() checks typeof Utilities.
// We mocked Utilities in mock_gas.js, so isGas() is true.
// So it used Utilities.computeDigest (mocked).
// So hash should be hex of 1s (from mock).
assert(registeredUser[6].length > 0, 'Password hashed');

// 3. Test Login
console.log('\nTest: Login');
var loginReq = {
  parameter: {
    action: 'login',
    identifier: 'student@test.com',
    password: '7890' // Correct password
  }
};
var loginRes = JSON.parse(Code.doPost(loginReq).getContent());
assert(loginRes.success === true, 'Login success');
assert(loginRes.data.token, 'Token returned');

// 4. Test Login Fail
console.log('\nTest: Login Fail');
var failReq = {
  parameter: {
    action: 'login',
    identifier: 'student@test.com',
    password: '0000' // Wrong password
  }
};
var failRes = JSON.parse(Code.doPost(failReq).getContent());
assert(failRes.success === false, 'Login failed as expected');

console.log('\nAll tests passed!');
