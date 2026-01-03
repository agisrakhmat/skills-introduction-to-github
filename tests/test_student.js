require('./mock_gas');
const assert = require('assert');

// Load All Modules
global.Config = require('../src/Config.gs');
global.Utils = require('../src/Utils.gs');
global.DatabaseSetup = require('../src/DatabaseSetup.gs');
global.Auth = require('../src/Auth.js');
global.Users = require('../src/Users.js');
global.Courses = require('../src/Courses.js');
global.Enrollments = require('../src/Enrollments.js');
global.Grading = require('../src/Grading.js');
global.Attendance = require('../src/Attendance.js');
global.Assignments = require('../src/Assignments.js');
global.Submissions = require('../src/Submissions.js');
global.Student = require('../src/Student.js');

console.log('Running Student Tests...');

// 1. Setup Data
// User
// Need to reset mock data first if running after other tests, but here we run standalone or clean env.
// Mock GAS handles sheet clearing if needed, but here we just append.
SpreadsheetApp._reset();
DatabaseSetup.run(); // Create sheets

const user = Users.createUser({
  email: 'student@test.com',
  phone: '628123',
  full_name: 'Test Student',
  role: 'STUDENT',
  user_id: 'S001'
});
// Need to simulate Login to get token if we were testing Code.js, but we test modules directly or mimic params.

// Courses
const c1Id = Courses.createCourse({
  course_id: 'C101', name: 'Intro to Fiqh', level: 1, sks: 2, semester_period: '2025-1'
});
const c2Id = Courses.createCourse({
  course_id: 'C201', name: 'Advanced Fiqh', level: 2, sks: 2, semester_period: '2025-1'
});

// 2. Test Enrollment
console.log('Test: Enrollment');
// Enroll C1
var resEnroll = Enrollments.enroll(user.user_id, 'C101');
assert.strictEqual(JSON.parse(resEnroll.getContent()).status, 'success');

// Enroll C2 (Should Fail - Single Level Policy)
// Student is Enrolled in Level 1. Level 2 is different level.
var resEnroll2 = Enrollments.enroll(user.user_id, 'C201');
var bodyEnroll2 = JSON.parse(resEnroll2.getContent());
assert.strictEqual(bodyEnroll2.status, 'error');
assert.ok(bodyEnroll2.message.includes('Level'), 'Message should mention Level violation');

// 3. Test Attendance
console.log('Test: Attendance');
Student.submitAttendance({ student_id: user.user_id, course_id: 'C101', status: 'HADIR', date: new Date().toISOString() });
Student.submitAttendance({ student_id: user.user_id, course_id: 'C101', status: 'REKAMAN', date: new Date().toISOString() });
// Avg: (100+80)/2 = 90.

// 4. Test Assignments & Grades
console.log('Test: Grading');
// Create Assignments
var a1 = Assignments.create('C101', 'TUGAS', 100);
var aUTS = Assignments.create('C101', 'UTS', 100);
var aUAS = Assignments.create('C101', 'UAS', 100);

// Submit Scores
Submissions.submit(a1, user.user_id, 80);
Submissions.submit(aUTS, user.user_id, 70);
Submissions.submit(aUAS, user.user_id, 75);

// 5. Test Dashboard Calculation
console.log('Test: Dashboard');
var resDash = Student.getDashboardData(user.user_id);
var bodyDash = JSON.parse(resDash.getContent());
var courseData = bodyDash.data.academics[0];

assert.strictEqual(courseData.course_id, 'C101');
assert.strictEqual(courseData.scores.attendance, 90);
assert.strictEqual(courseData.scores.assignment, 80);
assert.strictEqual(courseData.scores.uts, 70);
assert.strictEqual(courseData.scores.uas, 75);

// Final: 90*0.2 + 80*0.15 + 70*0.3 + 75*0.35 = 18 + 12 + 21 + 26.25 = 77.25
assert.strictEqual(courseData.final_score, 77.25);

// Point < 3.0? (77.25 < 80)
// My implementation in Grading.js: 70-79 is 2.0.
assert.strictEqual(courseData.final_point, 2.0);
assert.strictEqual(courseData.status, 'FAILED');

console.log('All Student Tests Passed!');
