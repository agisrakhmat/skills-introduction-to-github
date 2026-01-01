// Main entry point for Google Apps Script

if (typeof require !== 'undefined') {
    var Auth = require('./Auth');
    var Config = require('./Config');
    var Database = require('./Database');
}

function doGet(e) {
  return HtmlService.createHtmlOutput("<h1>Diploma Ilmi LMS Backend</h1>");
}

function doPost(e) {
  if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'No post data' })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
      var data = JSON.parse(e.postData.contents);
      var action = data.action;
      var result = {};

      switch (action) {
          case 'login':
              result = Auth.login(data.identifier, data.password);
              break;
          default:
              result = { success: false, message: 'Unknown action' };
      }

      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error: ' + error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Setup function to initialize the database sheets.
 * Run this function once from the GAS editor.
 */
function setupDatabase() {
  var sheets = [
      { name: Config.SHEET_USERS, headers: ['user_id', 'email', 'full_name', 'phone', 'role', 'status', 'password_hash'] },
      { name: Config.SHEET_COURSES, headers: ['course_id', 'name', 'lecturer_id', 'level', 'sks', 'semester_period'] },
      { name: Config.SHEET_ENROLLMENTS, headers: ['enrollment_id', 'student_id', 'course_id', 'final_grade', 'final_point', 'status'] },
      { name: Config.SHEET_ATTENDANCE, headers: ['attendance_id', 'course_id', 'student_id', 'session_date', 'status', 'points'] },
      { name: Config.SHEET_ASSIGNMENTS, headers: ['assignment_id', 'course_id', 'type', 'max_score'] },
      { name: Config.SHEET_SUBMISSIONS, headers: ['submission_id', 'assignment_id', 'student_id', 'score'] },
      { name: Config.SHEET_PAYMENTS, headers: ['payment_id', 'student_id', 'amount', 'proof_url', 'status'] },
      { name: Config.SHEET_CERTIFICATES, headers: ['certificate_id', 'student_id', 'course_id', 'enrollment_id', 'certificate_number', 'issue_date', 'download_url'] }
  ];

  var ss;
  if (Config.SPREADSHEET_ID) {
      try {
          ss = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
      } catch (e) {
          console.warn('Could not open spreadsheet by ID, using active spreadsheet: ' + e.message);
          ss = SpreadsheetApp.getActiveSpreadsheet();
      }
  } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error('No active spreadsheet found.');
  }

  sheets.forEach(function(sheetDef) {
      var sheet = ss.getSheetByName(sheetDef.name);
      if (!sheet) {
          sheet = ss.insertSheet(sheetDef.name);
          sheet.appendRow(sheetDef.headers);

          // Add default admin user if USERS sheet is created
          if (sheetDef.name === Config.SHEET_USERS) {
             // Default Admin: admin@diplomailmi.com / 1234
             // Hash for 1234: 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
             sheet.appendRow(['ADMIN_001', 'admin@diplomailmi.com', 'Super Admin', '6280000000000', 'ADMIN', 'ACTIVE', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4']);
          }
      }
  });

  return 'Database setup complete.';
}
