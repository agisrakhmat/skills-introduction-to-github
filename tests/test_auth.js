require('./mock_gas');
const assert = require('assert');

// Load modules
global.Config = require('../src/Config.gs');
global.Utils = require('../src/Utils.gs');
global.Auth = require('../src/Auth.js');
global.Users = require('../src/Users.js');

console.log('Running Auth Tests...');

// 1. Setup Data
const testUser = [
  'DI.IN.25.07.RGR.0001', // id (Updated year to match Config.CURRENT_YEAR which is '25')
  'student@test.com',     // email
  'Test Student',         // name
  '6281234567890',        // phone
  'STUDENT',              // role
  'ACTIVE',               // status
  Auth.hashPassword('7890') // password (last 4 digits)
];

// Header + Data
SpreadsheetApp._seed('USERS', [
  ['user_id', 'email', 'full_name', 'phone', 'role', 'status', 'password_hash'],
  testUser
]);

// 2. Test Login Success
console.log('Test: Login Success');
var response = Auth.login({ login: 'student@test.com', password: '7890' });
var body = JSON.parse(response.getContent());
assert.strictEqual(body.status, 'success');
assert.ok(body.data.token);
assert.strictEqual(body.data.user.email, 'student@test.com');

// 3. Test Login Failure
console.log('Test: Login Failure (Wrong Password)');
var responseFail = Auth.login({ login: 'student@test.com', password: '0000' });
var bodyFail = JSON.parse(responseFail.getContent());
assert.strictEqual(bodyFail.status, 'error');

// 4. Test Token Verification
console.log('Test: Token Verification');
var token = body.data.token;
var payload = Auth.verifyToken(token);
assert.ok(payload);
assert.strictEqual(payload.sub, 'DI.IN.25.07.RGR.0001');

// 5. Test Create User (Manual ID)
console.log('Test: Create User (Manual ID)');
var newUser = {
  user_id: 'DI.AT.25.07.RGR.0005', // Explicit ID
  email: 'new@test.com',
  full_name: 'New User',
  phone: '6289999999999', // pass: 9999
  role: 'STUDENT'
};
Users.createUser(newUser);
var storedUser = Users.findByLogin('new@test.com');
assert.ok(storedUser);
assert.strictEqual(storedUser.user_id, 'DI.AT.25.07.RGR.0005');

// 6. Test Registration (Auto ID)
console.log('Test: Registration (Auto ID)');

// 6a. Register Ikhwan (Male) -> Should increment from DI.IN...0001 -> 0002
var regParams = {
  email: 'reg@test.com',
  phone: '6288888888888',
  full_name: 'Registered Student',
  gender: 'L' // Ikhwan -> IN
};
var responseReg = Auth.register(regParams);
var bodyReg = JSON.parse(responseReg.getContent());
assert.strictEqual(bodyReg.status, 'success', bodyReg.message);
assert.ok(bodyReg.data.token);
assert.ok(bodyReg.data.user.user_id.includes('.IN.25.07.RGR.0002'));

// 6b. Register Akhwat (Female) -> Should start at 0001 (since only 0005 exists manually, max is 5?)
// Wait, if 0005 exists, max is 5. Next is 6.
// Prefix 'DI.AT...'. Existing: 'DI.AT...0005'. Max 5. Next 6.
var regParams2 = {
  email: 'reg2@test.com',
  phone: '6287777777777',
  full_name: 'Registered Student 2',
  gender: 'P' // Akhwat -> AT
};
var responseReg2 = Auth.register(regParams2);
var bodyReg2 = JSON.parse(responseReg2.getContent());
assert.strictEqual(bodyReg2.status, 'success');
assert.ok(bodyReg2.data.user.user_id.includes('.AT.25.07.RGR.0006'));

console.log('All Auth Tests Passed!');
