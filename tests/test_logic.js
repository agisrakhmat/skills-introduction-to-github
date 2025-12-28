// tests/test_logic.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DB } = require('./MockGAS');

// Load GAS files into global context
const srcDir = path.join(__dirname, '../src');
const files = ['Config.gs', 'Database.gs', 'Auth.gs', 'BusinessLogic.gs', 'Setup.gs'];

files.forEach(file => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  vm.runInThisContext(content);
});

// Helper to init DB
function initDB() {
  // Clear DB
  DB.sheets = {};
  setupDatabase(); // From Setup.gs
}

function runTests() {
  console.log("Starting Tests...");

  initDB();

  // Test 1: Register Student
  console.log("\nTest 1: Register Student");
  var res = registerStudent("student@test.com", "Test Student", "081234567890");
  if (res.success && res.message.includes("last 4 digits")) {
    console.log("PASS: Registration successful");
  } else {
    console.log("FAIL: Registration failed", res);
  }

  // Verify DB
  var users = getData("USERS");
  var user = users.find(u => u.email === "student@test.com");
  if (user && user.password_hash === "7890") {
    console.log("PASS: User saved correctly with password hash");
  } else {
    console.log("FAIL: User data incorrect", user);
  }

  // Test 2: Enroll Check (Single Level Policy)
  console.log("\nTest 2: Single Level Policy");
  // Create courses
  var courses = [
    { course_id: "C1-1", name: "Fiqh 1", level: 1, sks: 2 },
    { course_id: "C2-1", name: "Fiqh 2", level: 2, sks: 2 }
  ];
  courses.forEach(c => insertData("COURSES", c));

  // Enroll student in Level 1
  enrollStudent(user.user_id, "C1-1");

  // Try to enroll in Level 2 (Should Fail)
  var enrollRes = enrollStudent(user.user_id, "C2-1");
  if (!enrollRes.success && enrollRes.message.includes("Single Level Policy")) {
    console.log("PASS: Blocked mixed level enrollment");
  } else {
    console.log("FAIL: Did not block mixed level enrollment", enrollRes);
  }

  // Test 3: Grading Calculation
  console.log("\nTest 3: Grading Calculation");
  var enrollment = getData("ENROLLMENTS")[0];

  // Add Attendance
  var atts = [
    { attendance_id: "a1", course_id: "C1-1", student_id: user.user_id, status: "HADIR" },
    { attendance_id: "a2", course_id: "C1-1", student_id: user.user_id, status: "HADIR" },
    { attendance_id: "a3", course_id: "C1-1", student_id: user.user_id, status: "REKAMAN" },
    { attendance_id: "a4", course_id: "C1-1", student_id: user.user_id, status: "ALPA" }
  ];
  atts.forEach(a => insertData("ATTENDANCE", a));

  // Add Assignments
  insertData("ASSIGNMENTS", { assignment_id: "T1", course_id: "C1-1", type: "TUGAS", max_score: 100 });
  insertData("ASSIGNMENTS", { assignment_id: "UTS1", course_id: "C1-1", type: "UTS", max_score: 100 });
  insertData("ASSIGNMENTS", { assignment_id: "UAS1", course_id: "C1-1", type: "UAS", max_score: 100 });

  insertData("SUBMISSIONS", { submission_id: "S1", assignment_id: "T1", student_id: user.user_id, score: 80 });
  insertData("SUBMISSIONS", { submission_id: "S2", assignment_id: "UTS1", student_id: user.user_id, score: 90 });
  insertData("SUBMISSIONS", { submission_id: "S3", assignment_id: "UAS1", student_id: user.user_id, score: 85 });

  var gradeRes = calculateGrade(enrollment.enrollment_id);
  console.log("Calculated Grade:", gradeRes);

  if (Math.abs(gradeRes.final_grade - 82.75) < 0.01) {
    console.log("PASS: Final Score Calculation correct");
  } else {
    console.log("FAIL: Score mismatch. Expected 82.75, got " + gradeRes.final_grade);
  }

  if (gradeRes.final_point === 3.0 && gradeRes.status === "PASSED") {
     console.log("PASS: Point and Status correct");
  } else {
     console.log("FAIL: Point/Status mismatch");
  }

  // Test 4: Sequential Progression (Retake Scenario)
  console.log("\nTest 4: Sequential Progression & Retake");

  // Course C1-2 (Required for Level 2)
  insertData("COURSES", { course_id: "C1-2", name: "Aqidah 1", level: 1, sks: 2 });

  // Scenario: Student fails C1-2 first time
  var failEnroll = {
    enrollment_id: "fail-e",
    student_id: user.user_id,
    course_id: "C1-2",
    final_grade: 50,
    final_point: 0,
    status: "FAILED"
  };
  insertData("ENROLLMENTS", failEnroll);

  // Try to enroll in Level 2 (Should Fail)
  var enrollResFail = enrollStudent(user.user_id, "C2-1");
  if (!enrollResFail.success && enrollResFail.message.includes("Sequential Progression")) {
     console.log("PASS: Blocked due to failed course");
  } else {
     console.log("FAIL: Should block because C1-2 is FAILED", enrollResFail);
  }

  // Scenario: Student retakes C1-2 and Passes
  var passEnroll = {
    enrollment_id: "pass-e",
    student_id: user.user_id,
    course_id: "C1-2",
    final_grade: 85,
    final_point: 3.0,
    status: "PASSED"
  };
  insertData("ENROLLMENTS", passEnroll);

  // Try to enroll in Level 2 (Should PASS now)
  var enrollResPass = enrollStudent(user.user_id, "C2-1");
  if (enrollResPass.success) {
     console.log("PASS: Allowed enrollment after retake passed");
  } else {
     console.log("FAIL: Blocked even after passing retake", enrollResPass);
  }
}

runTests();
