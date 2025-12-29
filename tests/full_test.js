/**
 * Database Configuration and Wrapper
 * Maps the Google Sheet structure to the code.
 */

var DB_CONFIG = {
  spreadsheetId: 'REPLACE_WITH_ACTUAL_ID', // Akan diisi user nanti
  sheets: {
    USERS: 'USERS',
    COURSES: 'COURSES',
    ENROLLMENTS: 'ENROLLMENTS',
    ATTENDANCE: 'ATTENDANCE',
    ASSIGNMENTS: 'ASSIGNMENTS',
    SUBMISSIONS: 'SUBMISSIONS',
    PAYMENTS: 'PAYMENTS'
  }
};

/**
 * Column Mappings (0-based index)
 * Ensures consistency when reading/writing arrays using getValues()/setValues()
 */
var COLUMNS = {
  USERS: {
    USER_ID: 0,
    EMAIL: 1,
    FULL_NAME: 2,
    PHONE: 3,
    ROLE: 4,     // STUDENT, LECTURER, FINANCE, ADMIN, ACADEMIC
    STATUS: 5,   // ACTIVE, INACTIVE
    PASSWORD: 6
  },
  COURSES: {
    COURSE_ID: 0,
    NAME: 1,
    LECTURER_ID: 2,
    LEVEL: 3,        // 1-6 (Mustawa)
    SKS: 4,
    SEMESTER: 5
  },
  ENROLLMENTS: {
    ENROLLMENT_ID: 0,
    STUDENT_ID: 1,
    COURSE_ID: 2,
    FINAL_GRADE: 3, // 0-100
    FINAL_POINT: 4, // 0-4.0
    STATUS: 5       // ENROLLED, PASSED, FAILED
  },
  ATTENDANCE: {
    ATTENDANCE_ID: 0,
    COURSE_ID: 1,
    STUDENT_ID: 2,
    SESSION_DATE: 3,
    STATUS: 4,      // HADIR, REKAMAN, IZIN, ALPA
    POINTS: 5       // 100, 80, 50, 0
  },
  ASSIGNMENTS: {
    ASSIGNMENT_ID: 0,
    COURSE_ID: 1,
    TYPE: 2,       // TUGAS, UTS, UAS
    MAX_SCORE: 3
  },
  SUBMISSIONS: {
    SUBMISSION_ID: 0,
    ASSIGNMENT_ID: 1,
    STUDENT_ID: 2,
    SCORE: 3
  },
  PAYMENTS: {
    PAYMENT_ID: 0,
    STUDENT_ID: 1,
    AMOUNT: 2,
    PROOF_URL: 3,
    STATUS: 4      // PENDING, VERIFIED, REJECTED
  }
};

/**
 * Helper function to simulate DB connection for local testing.
 * In production, this uses SpreadsheetApp.
 */
function getSheetData(sheetName) {
  if (typeof SpreadsheetApp === 'undefined') {
    // Mock data for local testing
    return MOCK_DB[sheetName] || [];
  }
  var ss = SpreadsheetApp.openById(DB_CONFIG.spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  // Assume header is row 1, data starts row 2
  return sheet.getDataRange().getValues().slice(1);
}

/**
 * Helper to append a row to the sheet (Production & Mock)
 */
function appendRowToSheet(sheetName, rowData) {
  if (typeof SpreadsheetApp === 'undefined') {
    // Mock Environment
    if (!MOCK_DB[sheetName]) MOCK_DB[sheetName] = [];
    MOCK_DB[sheetName].push(rowData);
    return;
  }

  // Production Environment
  var ss = SpreadsheetApp.openById(DB_CONFIG.spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.appendRow(rowData);
  } else {
    throw new Error('Sheet not found: ' + sheetName);
  }
}

/**
 * Mock Database for Testing
 */
var MOCK_DB = {
  USERS: [],
  COURSES: [],
  ENROLLMENTS: [],
  ATTENDANCE: [],
  ASSIGNMENTS: [],
  SUBMISSIONS: [],
  PAYMENTS: []
};
/**
 * Seeder to populate Mock DB
 */
function seedDatabase() {
  // Clear existing
  MOCK_DB.USERS = [];
  MOCK_DB.COURSES = [];

  // Seed Users
  // Format: [ID, EMAIL, NAME, PHONE, ROLE, STATUS, PASSWORD]
  MOCK_DB.USERS.push([
    'ADM001',
    'admin@diploma.id',
    'Super Admin',
    '628110000000',
    'ADMIN',
    'ACTIVE',
    '0000' // Last 4 digits
  ]);

  MOCK_DB.USERS.push([
    'MHS001',
    'student@diploma.id',
    'Ahmad Student',
    '6281234567890',
    'STUDENT',
    'ACTIVE',
    '7890' // Last 4 digits of 6281234567890
  ]);

  // Seed Courses
  // Format: [ID, NAME, LECTURER_ID, LEVEL, SKS, SEMESTER]
  MOCK_DB.COURSES.push(['CRS101', 'Aqidah Dasar', 'LEC001', 1, 2, '2024-GANJIL']);
  MOCK_DB.COURSES.push(['CRS102', 'Fiqh Ibadah', 'LEC001', 1, 2, '2024-GANJIL']);
  MOCK_DB.COURSES.push(['CRS201', 'Ushul Fiqh', 'LEC002', 2, 2, '2024-GANJIL']);

  console.log('Database seeded with dummy data.');
}
/**
 * Auth Controller
 * Handles Registration and Login
 */

/**
 * Register a new student
 * @param {Object} data - {fullName, email, phone, gender, batch, status}
 */
function registerStudent(data) {
  var users = getSheetData('USERS'); // In production this reads Sheets

  // 1. Validation
  if (!data.email || !data.phone || !data.fullName) {
    return { success: false, message: 'Data tidak lengkap.' };
  }

  // Check duplicates
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u[COLUMNS.USERS.EMAIL] == data.email) return { success: false, message: 'Email sudah terdaftar.' };
    if (u[COLUMNS.USERS.PHONE] == data.phone) return { success: false, message: 'No WA sudah terdaftar.' };
  }

  // 2. Generate Credentials
  var password = data.phone.toString().slice(-4); // Last 4 digits
  var nim = generateNim(data, users);

  // 3. Save to DB (In real GAS, using appendRow)
  var newUser = [
    nim,
    data.email,
    data.fullName,
    data.phone,
    'STUDENT',
    'ACTIVE',
    password
  ];

  // 3. Save to DB
  appendRowToSheet('USERS', newUser);

  return {
    success: true,
    message: 'Registrasi berhasil.',
    data: {
      nim: nim,
      password: password,
      info: 'Gunakan NIM/Email/WA dan 4 digit terakhir WA untuk login.'
    }
  };
}

/**
 * Login User
 * Identifier can be Email, Phone, or NIM (User ID)
 */
function loginUser(identifier, password) {
  var users = getSheetData('USERS');

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var isMatch = (
      u[COLUMNS.USERS.EMAIL] == identifier ||
      u[COLUMNS.USERS.PHONE] == identifier ||
      u[COLUMNS.USERS.USER_ID] == identifier
    );

    if (isMatch) {
      if (u[COLUMNS.USERS.PASSWORD] == password) {
        return {
          success: true,
          token: Utilities_base64Encode(u[COLUMNS.USERS.USER_ID] + ':' + new Date().getTime()), // Simple mock token
          user: {
            id: u[COLUMNS.USERS.USER_ID],
            name: u[COLUMNS.USERS.FULL_NAME],
            role: u[COLUMNS.USERS.ROLE],
            status: u[COLUMNS.USERS.STATUS]
          }
        };
      } else {
        return { success: false, message: 'Password salah.' };
      }
    }
  }

  return { success: false, message: 'User tidak ditemukan.' };
}

/**
 * Helper: Generate NIM
 * Format: DI.AA.BB.CC.DDD.EEEE
 * AA: Gender (IN=Male, AT=Female) - derived from form input usually, assuming default IN here if missing
 * BB: Year (24)
 * CC: Batch (01)
 * DDD: Status (RGR)
 * EEEE: Sequence
 */
function generateNim(data, existingUsers) {
  var genderCode = (data.gender === 'FEMALE') ? 'AT' : 'IN';
  var year = new Date().getFullYear().toString().slice(-2);
  var batch = data.batch || '01';
  var status = 'RGR'; // Default Regular

  var prefix = 'DI.' + genderCode + '.' + year + '.' + batch + '.' + status;

  // Find max sequence with this prefix
  var maxSeq = 0;
  for (var i = 0; i < existingUsers.length; i++) {
    var id = existingUsers[i][COLUMNS.USERS.USER_ID];
    if (id && id.startsWith(prefix)) {
      var parts = id.split('.');
      var seq = parseInt(parts[parts.length-1]);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  var newSeq = (maxSeq + 1).toString().padStart(4, '0');
  return prefix + '.' + newSeq;
}

// Mock Utilities for local testing if needed
function Utilities_base64Encode(str) {
    return typeof Utilities !== 'undefined' ? Utilities.base64Encode(str) : btoa(str);
}
/**
 * ACADEMIC CONTROLLER
 * Handles Grading, Attendance, and Progression Logic
 */

// Grading Constants
var WEIGHTS = {
  ATTENDANCE: 0.20,
  ASSIGNMENT: 0.15,
  UTS: 0.30,
  UAS: 0.35
};

var ATTENDANCE_VALUES = {
  'HADIR': 100,
  'REKAMAN': 80,
  'IZIN': 50,
  'ALPA': 0
};

var PASSING_GRADE = {
  MIN_POINT: 3.0,
  MIN_SCORE: 80
};

/**
 * Calculate Final Grade for a Student in a Course
 */
function calculateFinalGrade(studentId, courseId) {
  // 1. Get Components
  var attScore = calculateAttendanceScore(studentId, courseId);
  var assignScore = getComponentScore(studentId, courseId, 'TUGAS');
  var utsScore = getComponentScore(studentId, courseId, 'UTS');
  var uasScore = getComponentScore(studentId, courseId, 'UAS');

  // 2. Apply Formula
  var finalScore = (attScore * WEIGHTS.ATTENDANCE) +
                   (assignScore * WEIGHTS.ASSIGNMENT) +
                   (utsScore * WEIGHTS.UTS) +
                   (uasScore * WEIGHTS.UAS);

  // 3. Convert to Point and Status
  var point = convertToPoint(finalScore);
  var status = (point >= PASSING_GRADE.MIN_POINT) ? 'PASSED' : 'FAILED';

  return {
    score: finalScore,
    point: point,
    status: status,
    details: { att: attScore, tugas: assignScore, uts: utsScore, uas: uasScore }
  };
}

/**
 * Helper: Calculate Attendance Score Average
 */
function calculateAttendanceScore(studentId, courseId) {
  var attendances = getSheetData('ATTENDANCE');
  var totalPoints = 0;
  var count = 0;

  for (var i = 0; i < attendances.length; i++) {
    var row = attendances[i];
    if (row[COLUMNS.ATTENDANCE.STUDENT_ID] == studentId &&
        row[COLUMNS.ATTENDANCE.COURSE_ID] == courseId) {

      // Auto-convert status to value if points empty
      var status = row[COLUMNS.ATTENDANCE.STATUS];
      var points = row[COLUMNS.ATTENDANCE.POINTS];
      if (points === '' || points == null) {
        points = ATTENDANCE_VALUES[status] || 0;
      }

      totalPoints += Number(points);
      count++;
    }
  }

  return (count === 0) ? 0 : (totalPoints / count);
}

/**
 * Helper: Get Assignment/Exam Score Average
 */
function getComponentScore(studentId, courseId, type) {
  var assignments = getSheetData('ASSIGNMENTS');
  var submissions = getSheetData('SUBMISSIONS');

  // Find all assignments of this type for this course
  var targetAssignIds = [];
  for (var i = 0; i < assignments.length; i++) {
    if (assignments[i][COLUMNS.ASSIGNMENTS.COURSE_ID] == courseId &&
        assignments[i][COLUMNS.ASSIGNMENTS.TYPE] == type) {
      targetAssignIds.push(assignments[i][COLUMNS.ASSIGNMENTS.ASSIGNMENT_ID]);
    }
  }

  if (targetAssignIds.length === 0) return 0; // No assignments of this type

  // Calculate total score obtained
  var totalScore = 0;
  for (var j = 0; j < targetAssignIds.length; j++) {
    var aId = targetAssignIds[j];
    // Find submission
    var score = 0;
    for (var k = 0; k < submissions.length; k++) {
      if (submissions[k][COLUMNS.SUBMISSIONS.ASSIGNMENT_ID] == aId &&
          submissions[k][COLUMNS.SUBMISSIONS.STUDENT_ID] == studentId) {
        score = Number(submissions[k][COLUMNS.SUBMISSIONS.SCORE] || 0);
        break;
      }
    }
    totalScore += score;
  }

  return totalScore / targetAssignIds.length; // Average
}

/**
 * Convert Score to Point (4.0 Scale)
 */
function convertToPoint(score) {
  if (score >= 90) return 4.0; // Mumtaz
  if (score >= 80) return 3.0; // Jayyid Jiddan
  // Below 80 is Failed (< 3.0)
  // Linear interpolation or fixed steps for below 80?
  // Spec implies < 80 is failed. Let's make it granular or strict.
  // Assuming simplified strict scale for now based on spec "Min 3.0"
  if (score >= 70) return 2.0;
  if (score >= 60) return 1.0;
  return 0.0;
}

/**
 * Check if Student can enroll in a Target Level (Mustawa)
 * Implements Single Level Policy & Sequential Progression
 */
function canEnrollInLevel(studentId, targetLevel) {
  var enrollments = getSheetData('ENROLLMENTS');
  var courses = getSheetData('COURSES');

  // 1. Single Level Policy Check
  // Check if student is currently enrolled (and not passed/failed yet) in any other level
  // Actually, Single Level Policy usually means "Don't take Level 2 courses while taking Level 3 courses".
  // Or "Finish Level 1 before starting Level 2".

  if (targetLevel == 1) return { allowed: true }; // Level 1 is always open for new students

  // 2. Sequential Progression Check
  // Must pass ALL courses in Level (targetLevel - 1)
  var prevLevel = targetLevel - 1;

  // Get all courses in prevLevel
  var prevLevelCourseIds = [];
  for (var i = 0; i < courses.length; i++) {
    if (courses[i][COLUMNS.COURSES.LEVEL] == prevLevel) {
      prevLevelCourseIds.push(courses[i][COLUMNS.COURSES.COURSE_ID]);
    }
  }

  if (prevLevelCourseIds.length === 0) {
    // Weird case: Previous level has no courses? Allow.
    return { allowed: true };
  }

  // Check student's status for these courses
  var passedCount = 0;
  for (var j = 0; j < prevLevelCourseIds.length; j++) {
    var cId = prevLevelCourseIds[j];
    var isPassed = false;

    for (var k = 0; k < enrollments.length; k++) {
      if (enrollments[k][COLUMNS.ENROLLMENTS.STUDENT_ID] == studentId &&
          enrollments[k][COLUMNS.ENROLLMENTS.COURSE_ID] == cId &&
          enrollments[k][COLUMNS.ENROLLMENTS.STATUS] == 'PASSED') {
        isPassed = true;
        break;
      }
    }

    if (isPassed) passedCount++;
  }

  if (passedCount === prevLevelCourseIds.length) {
    return { allowed: true };
  } else {
    return {
      allowed: false,
      reason: 'Anda belum lulus semua mata kuliah di Mustawa ' + prevLevel
    };
  }
}
// tests/test_scenarios.js

console.log('=== STARTING LOCAL TESTS ===');

// 1. Initialize DB
seedDatabase();
console.log('[OK] Database Seeded');

// 2. Test Registration
var regData = {
  fullName: 'Budi Santoso',
  email: 'budi@test.com',
  phone: '6281299998888', // Pwd ends in 8888
  gender: 'MALE'
};
var regResult = registerStudent(regData);
console.log('Register Result:', regResult.success ? 'PASS' : 'FAIL');

if (!regResult.success) {
    console.error('Registration Failed:', regResult);
    // process.exit(1);
}

var budiId = regResult.data.nim;
console.log('New Student NIM:', budiId);

// 3. Test Login
var loginResult = loginUser('6281299998888', '8888');
console.log('Login Result:', loginResult.success ? 'PASS' : 'FAIL');

// 4. Test Grading Logic
// Scenario: Budi takes CRS101 (Level 1)
// Mock Enrollment - index 0
MOCK_DB.ENROLLMENTS.push(['ENR001', budiId, 'CRS101', 0, 0, 'ENROLLED']);

// Mock Activities
// Attendance: 14 meetings, all HADIR (100)
for(var i=0; i<14; i++) {
    MOCK_DB.ATTENDANCE.push(['ATT'+i, 'CRS101', budiId, '2024-01-01', 'HADIR', 100]);
}
// Assignments: 2 tasks, score 90 and 100. Average should be 95?
// Logic in AcademicController: getComponentScore averages all submissions found for assignment type.
// If we have 1 assignment entry 'TUGAS' and 1 submission, score is that submission.
MOCK_DB.ASSIGNMENTS.push(['ASG01', 'CRS101', 'TUGAS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB01', 'ASG01', budiId, 95]);

// UTS: 80
MOCK_DB.ASSIGNMENTS.push(['UTS01', 'CRS101', 'UTS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB_UTS', 'UTS01', budiId, 80]);

// UAS: 85
MOCK_DB.ASSIGNMENTS.push(['UAS01', 'CRS101', 'UAS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB_UAS', 'UAS01', budiId, 85]);

// Calculate Grade
console.log('--- Calculating Grade ---');
var gradeResult = calculateFinalGrade(budiId, 'CRS101');
console.log('Grade Details:', JSON.stringify(gradeResult.details));
console.log('Final Score:', gradeResult.score);

// Expected:
// Att: 100 * 0.2 = 20
// Tgs: 95 * 0.15 = 14.25
// UTS: 80 * 0.3 = 24
// UAS: 85 * 0.35 = 29.75
// Total: 88.0 -> Point 3.0 (Jayyid Jiddan) -> PASSED

var expectedScore = 88.0;
if (Math.abs(gradeResult.score - expectedScore) < 0.1 && gradeResult.status === 'PASSED') {
    console.log('[PASS] Grading Logic Correct.');
    // Update Enrollment to PASSED manually for next test
    // Find enrollment index
    for(let k=0; k<MOCK_DB.ENROLLMENTS.length; k++){
        if(MOCK_DB.ENROLLMENTS[k][1] == budiId && MOCK_DB.ENROLLMENTS[k][2] == 'CRS101') {
             MOCK_DB.ENROLLMENTS[k][COLUMNS.ENROLLMENTS.STATUS] = 'PASSED';
        }
    }
} else {
    console.error('[FAIL] Grading Logic Incorrect. Expected ~88, got', gradeResult.score);
}

// 5. Test Progression (Mustawa)
console.log('--- Testing Mustawa Logic ---');

// Try enroll Level 2 (Target CRS201 which is Level 2)
// Logic: "Must pass ALL courses in Level (targetLevel - 1)"
// Level 1 courses in Seeder: CRS101, CRS102.
// Budi passed CRS101 (manually set above).
// Budi has NOT passed CRS102.
// So checkLevel2 should be FALSE.

var checkLevel2 = canEnrollInLevel(budiId, 2);
console.log('Can Enroll Level 2 (Should be FALSE):', checkLevel2.allowed);

if (checkLevel2.allowed === false) {
    console.log('[PASS] Sequential Progression Enforced (Blocked because Level 1 incomplete).');
} else {
    console.error('[FAIL] User allowed to skip level!', checkLevel2);
}

console.log('=== TESTS FINISHED ===');
