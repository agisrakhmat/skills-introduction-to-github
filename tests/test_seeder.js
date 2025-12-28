// tests/test_seeder.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DB } = require('./MockGAS');

// Load GAS files
const srcDir = path.join(__dirname, '../src');
const files = ['Config.gs', 'Database.gs', 'Auth.gs', 'Seeder.gs', 'Setup.gs'];

files.forEach(file => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  vm.runInThisContext(content);
});

// Helper to init DB
function initDB() {
  DB.sheets = {};
  setupDatabase(); // From Setup.gs
}

function runTests() {
  console.log("Starting Seeder Tests...");

  initDB();

  // Run Seeder
  try {
      seedDatabase();
      console.log("PASS: seedDatabase() ran without errors");
  } catch (e) {
      console.log("FAIL: seedDatabase() threw exception", e);
      return;
  }

  // Verify Data Count
  var users = getData("USERS");
  if (users.length >= 10) console.log("PASS: Users created: " + users.length);
  else console.log("FAIL: Not enough users: " + users.length);

  var courses = getData("COURSES");
  if (courses.length >= 10) console.log("PASS: Courses created: " + courses.length);
  else console.log("FAIL: Not enough courses");

  // Check specific user
  var testUser = users.find(u => u.user_id === "testing1");
  if (testUser && testUser.password_hash === "Admin12345") {
      console.log("PASS: User testing1 has correct password hash");
  } else {
      console.log("FAIL: User testing1 password check failed");
  }
}

runTests();
