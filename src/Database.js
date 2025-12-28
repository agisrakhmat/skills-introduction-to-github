// Database.js - Centralized Database Schema & Helper Functions

const SHEET_NAMES = {
  USERS: 'USERS',
  COURSES: 'COURSES',
  ENROLLMENTS: 'ENROLLMENTS',
  ATTENDANCE: 'ATTENDANCE',
  ASSIGNMENTS: 'ASSIGNMENTS',
  SUBMISSIONS: 'SUBMISSIONS',
  PAYMENTS: 'PAYMENTS',
  MATERIALS: 'MATERIALS', // From ERD
  CERTIFICATES: 'CERTIFICATES' // From ERD
};

// Schema Definition based on Spec v3.1
const SCHEMA = {
  USERS: [
    'user_id', 'email', 'full_name', 'phone', 'role', 'status', 'password_hash', 'created_at'
  ],
  COURSES: [
    'course_id', 'name', 'lecturer_id', 'level', 'sks', 'semester_period', 'description'
  ],
  ENROLLMENTS: [
    'enrollment_id', 'student_id', 'course_id', 'final_grade', 'final_point', 'status', 'enrolled_at'
  ],
  ATTENDANCE: [
    'attendance_id', 'course_id', 'student_id', 'session_date', 'status', 'points', 'notes'
  ],
  ASSIGNMENTS: [
    'assignment_id', 'course_id', 'title', 'type', 'max_score', 'deadline', 'description'
  ],
  SUBMISSIONS: [
    'submission_id', 'assignment_id', 'student_id', 'score', 'submitted_at', 'file_url'
  ],
  PAYMENTS: [
    'payment_id', 'student_id', 'amount', 'proof_url', 'status', 'payment_date', 'admin_notes'
  ],
  MATERIALS: [
    'material_id', 'course_id', 'title', 'type', 'url', 'uploaded_at'
  ],
  CERTIFICATES: [
    'certificate_id', 'student_id', 'course_id', 'issue_date', 'certificate_url'
  ]
};

/**
 * Initializes the database by creating sheets if they don't exist.
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_NAMES).forEach(key => {
    const sheetName = SHEET_NAMES[key];
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Set Header Row
      sheet.appendRow(SCHEMA[key]);
      sheet.setFrozenRows(1);
      Logger.log('Created sheet: ' + sheetName);
    }
  });
}

/**
 * Helper to get a sheet object by name key
 */
function getSheet(key) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES[key]);
}

/**
 * Generic function to append a row to a sheet.
 * @param {string} sheetKey - Key from SHEET_NAMES (e.g., 'USERS')
 * @param {Object} dataObj - Object with keys matching the schema columns
 */
function appendRow(sheetKey, dataObj) {
  const sheet = getSheet(sheetKey);
  const headers = SCHEMA[sheetKey];
  const row = headers.map(header => dataObj[header] || '');
  sheet.appendRow(row);
}

/**
 * Generic function to find a single row.
 */
function findRow(sheetKey, colName, value) {
  const sheet = getSheet(sheetKey);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(colName);

  if (colIndex === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex] == value) {
      let obj = {};
      headers.forEach((h, idx) => obj[h] = data[i][idx]);
      return obj;
    }
  }
  return null;
}

/**
 * Generic function to query multiple rows.
 */
function queryRows(sheetKey, filterFn) {
  const sheet = getSheet(sheetKey);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).filter(filterFn);
}
