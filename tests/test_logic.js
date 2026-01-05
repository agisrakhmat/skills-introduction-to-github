// Local Test Script for Diploma Ilmi Logic
const Config = require('../src/Config.js');
const Utils = require('../src/Utils.js'); // Load Utils first
const Database = require('../src/Database.js');
const Grading = require('../src/Grading.js');

// Inject Utils globally for Auth.js which expects it in global scope (GAS style)
global.Utils = Utils;
// Also Config
global.Config = Config;

const Auth = require('../src/Auth.js');
const Courses = require('../src/Courses.js');

// MOCK SpreadsheetApp for Database
global.SpreadsheetApp = {
  _data: {
    USERS: [["user_id", "email", "full_name", "phone", "role", "status", "password_hash"]]
  },
  openById: function(id) {
    return {
      getSheetByName: function(name) {
        if (!global.SpreadsheetApp._data[name]) return null;
        return {
          appendRow: function(row) {
            global.SpreadsheetApp._data[name].push(row);
          },
          getDataRange: function() {
            return {
              getValues: function() {
                return global.SpreadsheetApp._data[name];
              }
            };
          }
        };
      }
    };
  }
};

console.log("=== Running Local Tests with Mock DB ===");

// 1. Test Auth & DB Integration
console.log("--- Registering Student ---");
var phone = "081234567890";
var normPhone = Utils.normalizePhone(phone);
var newUser = Auth.registerStudent("test@example.com", "Budi Santoso", phone);

// Insert to Mock DB
Database.insert("USERS", newUser);

// Verify DB Content
var dbUser = Database.findOne("USERS", "phone", normPhone);
console.log("DB Fetch Result:", dbUser);

if (!dbUser || dbUser.full_name !== "Budi Santoso") throw new Error("DB Insert/Find Failed");
if (dbUser.password_hash !== Utils.hashPassword("7890")) throw new Error("Password Hash Mismatch");

// 2. Test Login
console.log("--- Testing Login ---");
var loginSuccess = Auth.login(null, "7890", dbUser);
var loginFail = Auth.login(null, "wrongpass", dbUser);

console.log(`Login Success (Expected True): ${loginSuccess}`);
console.log(`Login Fail (Expected False): ${loginFail}`);

if (!loginSuccess || loginFail) throw new Error("Login Logic Failed");

// 3. Test Grading
console.log("--- Testing Grading ---");
// 100 Absen, 80 Tugas, 70 UTS, 85 UAS -> 82.75
var score = Grading.calculateFinalScore(100, 80, 70, 85);
console.log("Score:", score);
if (score !== 82.75) throw new Error("Grading logic error");

var pred = Grading.getPointAndPredicate(score);
console.log("Predicate:", pred);
if (pred.predicate !== "Jayyid Jiddan") throw new Error("Predicate logic error");


console.log("=== All Tests Passed ===");
