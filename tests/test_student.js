// tests/test_student.js

var Mocks = require('./mock_gas');
var Config = require('../src/Config');
var Utils = require('../src/Utils');
var Database = require('../src/Database');
var Auth = require('../src/Auth');
var Student = require('../src/Student');
var Code = require('../src/Code');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('PASS: ' + message);
  }
}

console.log('Running Student Tests...');

// Setup
Mocks.resetMocks();
Code.manualSetup();

// 1. Create Data
// User
var userId = 'S001';
Database.appendRow(Config.SHEET_USERS, [userId, 'student@test.com', 'Student 1', '628111', 'STUDENT', 'ACTIVE', 'HASH']);
// Lecturer
var lecturerId = 'L001';
Database.appendRow(Config.SHEET_USERS, [lecturerId, 'lecturer@test.com', 'Lecturer 1', '628222', 'LECTURER', 'ACTIVE', 'HASH']);
// Courses
var courseId = 'C001';
Database.appendRow(Config.SHEET_COURSES, [courseId, 'Fiqh 1', lecturerId, 1, 2, '2024-GANJIL']);
// Enrollments
var enrollId = 'E001';
Database.appendRow(Config.SHEET_ENROLLMENTS, [enrollId, userId, courseId, 0, 0, 'ENROLLED']);

// Login to get token
var token = Utils.generateToken({ user_id: userId, role: 'STUDENT' });

// 2. Test Dashboard
console.log('\nTest: Dashboard');
var dashReq = {
  parameter: {
    action: 'student_dashboard',
    token: token
  }
};
var dashRes = JSON.parse(Code.doPost(dashReq).getContent());
if (!dashRes.success) console.log(dashRes);
assert(dashRes.success === true, 'Dashboard success');
assert(dashRes.data.user.full_name === 'Student 1', 'User name correct');
assert(dashRes.data.current_mustawa === 1, 'Current mustawa correct');

// 3. Test Courses
console.log('\nTest: Courses');
var courseReq = {
  parameter: {
    action: 'student_courses',
    token: token
  }
};
var courseRes = JSON.parse(Code.doPost(courseReq).getContent());
assert(courseRes.success === true, 'Get courses success');
assert(courseRes.data.length === 1, 'One course returned');
assert(courseRes.data[0].name === 'Fiqh 1', 'Course name correct');

// 4. Test Attendance Submit
console.log('\nTest: Submit Attendance');
var attReq = {
  parameter: {
    action: 'student_attendance_submit',
    token: token,
    course_id: courseId,
    session_date: '2024-01-01',
    status: 'HADIR'
  }
};
var attRes = JSON.parse(Code.doPost(attReq).getContent());
assert(attRes.success === true, 'Attendance submit success');

// Verify DB
var attData = Database.getData(Config.SHEET_ATTENDANCE);
assert(attData.length === 1, 'Attendance record created');
assert(attData[0].points === 100, 'Points correct (HADIR=100)');

console.log('\nAll tests passed!');
