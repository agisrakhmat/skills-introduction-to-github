// src/Database.js

// Ensure Config is available
if (typeof Config === 'undefined') {
  if (typeof require !== 'undefined') {
    var Config = require('./Config');
  } else {
    throw new Error('Config not loaded');
  }
}

var Database = {
  getSpreadsheet: function() {
    if (typeof SpreadsheetApp !== 'undefined') {
      try {
        return SpreadsheetApp.openById(Config.SPREADSHEET_ID);
      } catch (e) {
        console.error('Error opening spreadsheet by ID, using active spreadsheet');
        return SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      console.log('Mocking SpreadsheetApp for local testing');
      return null; // Mock handled in tests
    }
  },

  getSheet: function(sheetName) {
    var ss = this.getSpreadsheet();
    if (!ss) return null;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Auto-create if not exists (for setup)
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  },

  // Generic function to append a row
  appendRow: function(sheetName, rowData) {
    var sheet = this.getSheet(sheetName);
    if (sheet) {
      sheet.appendRow(rowData);
      return true;
    }
    return false;
  },

  // Generic function to read all data (simple version)
  // Assumes first row is header
  getData: function(sheetName) {
    var sheet = this.getSheet(sheetName);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow < 2) return []; // Only header or empty

    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    var data = [];
    for (var i = 0; i < values.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = values[i][j];
      }
      data.push(row);
    }
    return data;
  },

  // Setup Database Schema (Run once)
  setupDatabase: function() {
    var ss = this.getSpreadsheet();
    if (!ss) return;

    // USERS
    this.createSheetWithHeaders(ss, Config.SHEET_USERS,
      ['user_id', 'email', 'full_name', 'phone', 'role', 'status', 'password_hash']);

    // COURSES
    this.createSheetWithHeaders(ss, Config.SHEET_COURSES,
      ['course_id', 'name', 'lecturer_id', 'level', 'sks', 'semester_period']);

    // ENROLLMENTS
    this.createSheetWithHeaders(ss, Config.SHEET_ENROLLMENTS,
      ['enrollment_id', 'student_id', 'course_id', 'final_grade', 'final_point', 'status']);

    // ATTENDANCE
    this.createSheetWithHeaders(ss, Config.SHEET_ATTENDANCE,
      ['attendance_id', 'course_id', 'student_id', 'session_date', 'status', 'points']);

    // ASSIGNMENTS
    this.createSheetWithHeaders(ss, Config.SHEET_ASSIGNMENTS,
      ['assignment_id', 'course_id', 'type', 'max_score']);

    // SUBMISSIONS
    this.createSheetWithHeaders(ss, Config.SHEET_SUBMISSIONS,
      ['submission_id', 'assignment_id', 'student_id', 'score']);

    // PAYMENTS
    this.createSheetWithHeaders(ss, Config.SHEET_PAYMENTS,
      ['payment_id', 'student_id', 'amount', 'proof_url', 'status']);
  },

  createSheetWithHeaders: function(ss, sheetName, headers) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    } else {
      // Check if headers exist, if not add them
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
      }
    }
  },

  // Find a user by email or phone
  findUser: function(identifier) {
    var users = this.getData(Config.SHEET_USERS);
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === identifier || users[i].phone === identifier || users[i].user_id === identifier) {
        return users[i];
      }
    }
    return null;
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Database;
}
