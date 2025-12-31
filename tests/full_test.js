// tests/full_test.js
// Simulation of the full lifecycle to verify logic locally

const DatabaseWrapper = require('../src/DatabaseWrapper.gs');
const AuthController = require('../src/AuthController.gs');
const AcademicController = require('../src/AcademicController.gs');
const FinanceController = require('../src/FinanceController.gs');
const AdminController = require('../src/AdminController.gs');

// Setup Mock Data
console.log("=== STARTING FULL SYSTEM TEST ===\n");

// 1. Setup Courses (Mustawa 1 and 2)
DatabaseWrapper._seedMock({
  USERS: [],
  COURSES: [
    { course_id: 'C101', name: 'Aqidah 1', level: 1 },
    { course_id: 'C102', name: 'Fiqh 1', level: 1 },
    { course_id: 'C201', name: 'Aqidah 2', level: 2 }
  ],
  ENROLLMENTS: [],
  ATTENDANCE: [],
  ASSIGNMENTS: [
    { assignment_id: 'A1_T1', course_id: 'C101', type: 'TUGAS', max_score: 100 },
    { assignment_id: 'A1_UTS', course_id: 'C101', type: 'UTS', max_score: 100 },
    { assignment_id: 'A1_UAS', course_id: 'C101', type: 'UAS', max_score: 100 }
  ],
  SUBMISSIONS: [],
  PAYMENTS: []
});

// 2. Register Student
console.log("1. Registering Student...");
try {
  var student = AuthController.registerStudent("Ahmad", "ahmad@test.com", "081234567890");
  console.log("   Success: " + student.user_id + " (Pass: 7890)");

  // Login
  var loggedUser = AuthController.login("081234567890", "7890");
  console.log("   Login Verified.");
} catch (e) {
  console.error("   Failed: " + e.message);
}

// 3. Try Enroll Level 2 (Should Fail)
console.log("\n2. Testing Progression Guard (Try Skip to Level 2)...");
var check1 = AcademicController.canEnrollInLevel(student.user_id, 2);
if (check1.allowed === false) {
  console.log("   Success: Blocked correctly (" + check1.reason + ")");
} else {
  console.error("   FAILED: System allowed skipping level!");
}

// 4. Enroll Level 1
console.log("\n3. Enrolling Level 1...");
var check2 = AcademicController.canEnrollInLevel(student.user_id, 1);
if (check2.allowed) {
  DatabaseWrapper.enrollStudent({ student_id: student.user_id, course_id: 'C101' });
  DatabaseWrapper.enrollStudent({ student_id: student.user_id, course_id: 'C102' });
  console.log("   Enrolled in C101, C102.");
}

// 5. Try Enroll Level 2 (Should Fail - Single Level Policy)
console.log("\n4. Testing Single Level Policy (Try Add Level 2 while active in 1)...");
var check3 = AcademicController.canEnrollInLevel(student.user_id, 2);
if (check3.allowed === false) {
  console.log("   Success: Blocked correctly (" + check3.reason + ")");
} else {
  console.error("   FAILED: System allowed mixed levels!");
}

// 6. Complete Course C101 (Pass)
console.log("\n5. Simulating Grading for C101 (PASS)...");
// Attendance: 10 Sessions (8 Hadir, 2 Alpha) -> 80%
// Formula: (80 * 20%) = 16
for(let i=0; i<8; i++) DatabaseWrapper._appendRow('ATTENDANCE', { student_id: student.user_id, course_id: 'C101', status: 'HADIR' });
for(let i=0; i<2; i++) DatabaseWrapper._appendRow('ATTENDANCE', { student_id: student.user_id, course_id: 'C101', status: 'ALPA' });

// Assignments: 100
DatabaseWrapper._appendRow('SUBMISSIONS', { assignment_id: 'A1_T1', student_id: student.user_id, score: 100 });
// UTS: 80
DatabaseWrapper._appendRow('SUBMISSIONS', { assignment_id: 'A1_UTS', student_id: student.user_id, score: 80 });
// UAS: 85
DatabaseWrapper._appendRow('SUBMISSIONS', { assignment_id: 'A1_UAS', student_id: student.user_id, score: 85 });

/*
Calc:
Att: (800/1000)*100 = 80 -> 20% = 16
Tugas: 100 -> 15% = 15
UTS: 80 -> 30% = 24
UAS: 85 -> 35% = 29.75
Total: 16 + 15 + 24 + 29.75 = 84.75
Result: > 80, Point 3.0 (Passed)
*/

var gradeC101 = AcademicController.calculateGrade(student.user_id, 'C101');
console.log("   Grade C101: " + gradeC101.finalScore + " (Point: " + gradeC101.finalPoint + ")");
if (gradeC101.passed) {
  console.log("   Status: PASSED");
  // Update Enrollment
  var enrollments = DatabaseWrapper.getEnrollmentsByStudent(student.user_id);
  var e1 = enrollments.find(e => e.course_id === 'C101');
  e1.final_point = gradeC101.finalPoint;
  e1.status = 'PASSED';
}

// 7. Complete Course C102 (FAIL)
console.log("\n6. Simulating Grading for C102 (FAIL)...");
// Just give low scores
// Att: 0
// Tasks: 0
// UTS: 50
// UAS: 50
// Total ~32
var gradeC102 = { finalScore: 32, finalPoint: 1.0, passed: false };
var enrollments2 = DatabaseWrapper.getEnrollmentsByStudent(student.user_id);
var e2 = enrollments2.find(e => e.course_id === 'C102');
e2.final_point = gradeC102.finalPoint; // 1.0
e2.status = 'FAILED';
console.log("   Status: FAILED");

// 8. Try Enroll Level 2 (Should Fail - Not all Level 1 passed)
console.log("\n7. Testing Sequential Progression (Fail one course in L1 -> Try L2)...");
var check4 = AcademicController.canEnrollInLevel(student.user_id, 2);
if (check4.allowed === false) {
  console.log("   Success: Blocked correctly (" + check4.reason + ")");
} else {
  console.error("   FAILED: System allowed progression with failed courses!");
}

// 9. Fix C102 (Retake and Pass)
console.log("\n8. Retaking C102 (PASS)...");
e2.final_point = 4.0;
e2.status = 'PASSED'; // Simulating a pass
var check5 = AcademicController.canEnrollInLevel(student.user_id, 2);
if (check5.allowed) {
  console.log("   Success: Progression allowed after passing all Level 1 courses.");
} else {
  console.error("   FAILED: Blocked even after passing all!");
}

console.log("\n=== TEST COMPLETE ===");
