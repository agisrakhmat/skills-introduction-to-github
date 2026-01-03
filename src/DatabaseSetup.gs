var DatabaseSetup = {

  run: function() {
    var ss = Utils.getDatabase();
    var sheets = Config.SHEETS;
    var created = [];

    // 1. USERS
    if (!ss.getSheetByName(sheets.USERS)) {
      var sheet = ss.insertSheet(sheets.USERS);
      sheet.appendRow(['user_id', 'email', 'full_name', 'phone', 'role', 'status', 'password_hash']);
      created.push(sheets.USERS);
    }

    // 2. COURSES
    if (!ss.getSheetByName(sheets.COURSES)) {
      var sheet = ss.insertSheet(sheets.COURSES);
      sheet.appendRow(['course_id', 'name', 'lecturer_id', 'level', 'sks', 'semester_period']);
      created.push(sheets.COURSES);
    }

    // 3. ENROLLMENTS
    if (!ss.getSheetByName(sheets.ENROLLMENTS)) {
      var sheet = ss.insertSheet(sheets.ENROLLMENTS);
      sheet.appendRow(['enrollment_id', 'student_id', 'course_id', 'final_grade', 'final_point', 'status']);
      created.push(sheets.ENROLLMENTS);
    }

    // 4. ATTENDANCE
    if (!ss.getSheetByName(sheets.ATTENDANCE)) {
      var sheet = ss.insertSheet(sheets.ATTENDANCE);
      sheet.appendRow(['attendance_id', 'course_id', 'student_id', 'session_date', 'status', 'points']);
      created.push(sheets.ATTENDANCE);
    }

    // 5. ASSIGNMENTS
    if (!ss.getSheetByName(sheets.ASSIGNMENTS)) {
      var sheet = ss.insertSheet(sheets.ASSIGNMENTS);
      sheet.appendRow(['assignment_id', 'course_id', 'type', 'max_score']);
      created.push(sheets.ASSIGNMENTS);
    }

    // 6. SUBMISSIONS
    if (!ss.getSheetByName(sheets.SUBMISSIONS)) {
      var sheet = ss.insertSheet(sheets.SUBMISSIONS);
      sheet.appendRow(['submission_id', 'assignment_id', 'student_id', 'score']);
      created.push(sheets.SUBMISSIONS);
    }

    // 7. PAYMENTS
    if (!ss.getSheetByName(sheets.PAYMENTS)) {
      var sheet = ss.insertSheet(sheets.PAYMENTS);
      sheet.appendRow(['payment_id', 'student_id', 'amount', 'proof_url', 'status']);
      created.push(sheets.PAYMENTS);
    }

    // 8. CERTIFICATES
    if (!ss.getSheetByName(sheets.CERTIFICATES)) {
      var sheet = ss.insertSheet(sheets.CERTIFICATES);
      sheet.appendRow(['certificate_id', 'student_id', 'course_id', 'enrollment_id', 'certificate_number', 'issue_date', 'download_url']);
      created.push(sheets.CERTIFICATES);
    }

    return Utils.createSuccessResponse({ created_sheets: created }, 'Database setup complete.');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseSetup;
}
