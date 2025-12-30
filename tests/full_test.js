// full_test.js
// Concatenates all files and runs a simulation test

const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

// Read files
const files = [
  'src/DatabaseWrapper.gs',
  'src/AuthController.gs',
  'src/AcademicController.gs',
  'src/FinanceController.gs',
  'src/AdminController.gs',
  'src/Seeder.gs',
  'src/Code.gs'
];

let code = '';
files.forEach(f => {
    code += fs.readFileSync(f, 'utf8') + '\n\n';
});

// Mock Google Apps Script Services
const sandbox = {
  SECRET_KEY: 'DIPLOMA_ILMI_SECRET_KEY',
  SpreadsheetApp: undefined,
  Utilities: {
    base64Encode: (s) => (Buffer.isBuffer(s) ? s.toString('base64') : Buffer.from(s).toString('base64')),
    base64Decode: (s) => Buffer.from(s, 'base64'),
    newBlob: (data) => ({
        getDataAsString: () => data.toString()
    }),
    computeHmacSha256Signature: (msg, key) => {
        // Create HMAC
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(msg);
        return hmac.digest(); // returns Buffer
    },
    computeDigest: (algo, msg) => {
        // Mock SHA-256 for password hash
        const hash = crypto.createHash('sha256');
        hash.update(msg);
        return hash.digest(); // Buffer
    },
    DigestAlgorithm: { SHA_256: 'SHA_256' }
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => {},
      releaseLock: () => {}
    })
  },
  CacheService: {
      getScriptCache: () => ({
          get: () => null,
          put: () => {},
          remove: () => {}
      })
  },
  ContentService: {
    MimeType: { JSON: 'JSON' },
    createTextOutput: (content) => ({
      setMimeType: () => {},
      getContent: () => content
    })
  },
  HtmlService: {
      createTemplateFromFile: (f) => ({
          evaluate: () => ({
              setTitle: () => ({
                  setXFrameOptionsMode: () => ({
                      addMetaTag: () => {}
                  })
              })
          })
      }),
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
  },
  console: console
};

// Test Script
const testScript = `
  console.log('--- Starting Tests ---');

  // 1. Seed Data
  Seeder.run();

  // Create Admin
  appendRow(TABLES.USERS, {
      user_id: 'ADMIN.01', email: 'admin@example.com', full_name: 'Admin', role: 'ADMIN', status: 'ACTIVE', password_hash: AuthController._hashPassword('admin123')
  });

  // 2. Test Login & Secure Token
  var loginRes = apiHandler({action: 'login', identifier: 'student1@example.com', password: '7890'});
  if (loginRes.status !== 'success') throw new Error('Login failed: ' + loginRes.message);

  var token = loginRes.data.token;
  console.log('Login Token:', token);
  if (token.split('.').length !== 2) throw new Error('Token format incorrect');

  // 3. Test Unauthorized Access (Bad Signature)
  var parts = token.split('.');
  var badToken = parts[0] + '.' + 'BADSIGNATURE';
  var badRes = apiHandler({action: 'get_dashboard_data', user_id: 'DI.IN.24.01.RGR.0001', token: badToken});
  console.log('Bad Token Attempt (Expect Error):', badRes.message);
  if (badRes.status !== 'error') throw new Error('Signature verification failed');

  // 4. Test Admin Actions
  var adminLogin = apiHandler({action: 'login', identifier: 'admin@example.com', password: 'admin123'});
  var adminToken = adminLogin.data.token;

  // 4a. Reset Password
  var resetRes = apiHandler({
      action: 'admin_reset_password',
      token: adminToken,
      target_user_id: 'DI.IN.24.01.RGR.0001',
      new_password: 'newpassword123'
  });
  console.log('Admin Reset Password:', resetRes.status);
  if (resetRes.status !== 'success') throw new Error('Reset password failed');

  // Verify new password works
  var newLogin = apiHandler({action: 'login', identifier: 'student1@example.com', password: 'newpassword123'});
  if (newLogin.status !== 'success') throw new Error('New password login failed');

  // 4b. Generate Certificate (Fail: Enrollment not passed)
  var enr = MOCK_DB.ENROLLMENTS[0];
  var certResFail = apiHandler({
      action: 'generate_certificate',
      token: adminToken,
      enrollment_id: enr.enrollment_id
  });
  console.log('Cert Generation on Fail (Expect Error):', certResFail.message);
  if (certResFail.status !== 'error') throw new Error('Cert generation should fail for non-passed student');

  // Mock Pass
  updateRow(TABLES.ENROLLMENTS, 'enrollment_id', enr.enrollment_id, { status: 'PASSED', final_point: 4.0 });

  // Retry Cert Generation
  var certResOk = apiHandler({
      action: 'generate_certificate',
      token: adminToken,
      enrollment_id: enr.enrollment_id
  });
  console.log('Cert Generation on Pass:', certResOk.status);
  if (certResOk.status !== 'success') throw new Error('Cert generation failed');


  console.log('--- Tests Passed ---');
`;

// Run
vm.createContext(sandbox);
vm.runInContext(code + testScript, sandbox);
