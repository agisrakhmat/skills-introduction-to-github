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
