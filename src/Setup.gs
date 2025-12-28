// src/Setup.gs

/**
 * Run this function once to set up your Google Sheet Database.
 * It will create the necessary tabs and columns.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  var schemas = [
    {
      name: CONFIG.SHEET_NAMES.USERS,
      headers: ["user_id", "email", "full_name", "phone", "role", "status", "password_hash"]
    },
    {
      name: CONFIG.SHEET_NAMES.COURSES,
      headers: ["course_id", "name", "lecturer_id", "level", "sks", "semester_period"]
    },
    {
      name: CONFIG.SHEET_NAMES.ENROLLMENTS,
      headers: ["enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"]
    },
    {
      name: CONFIG.SHEET_NAMES.ATTENDANCE,
      headers: ["attendance_id", "course_id", "student_id", "session_date", "status", "points"]
    },
    {
      name: CONFIG.SHEET_NAMES.ASSIGNMENTS,
      headers: ["assignment_id", "course_id", "type", "max_score"]
    },
    {
      name: CONFIG.SHEET_NAMES.SUBMISSIONS,
      headers: ["submission_id", "assignment_id", "student_id", "score"]
    },
    {
      name: CONFIG.SHEET_NAMES.PAYMENTS,
      headers: ["payment_id", "student_id", "amount", "proof_url", "status"]
    }
  ];

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
      sheet.appendRow(schema.headers);
      // Freeze header row
      sheet.setFrozenRows(1);
      Logger.log("Created sheet: " + schema.name);
    } else {
      // Check if headers exist, if not append them (basic check)
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(schema.headers);
        sheet.setFrozenRows(1);
        Logger.log("Added headers to existing sheet: " + schema.name);
      } else {
        Logger.log("Sheet already exists: " + schema.name);
      }
    }
  });

  Logger.log("Database setup complete.");
}
