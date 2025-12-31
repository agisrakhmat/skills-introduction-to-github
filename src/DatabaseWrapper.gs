/**
 * DatabaseWrapper.gs
 * Handles interactions with Google Sheets (or Mock Data for testing).
 */

var DatabaseWrapper = (function() {

  // Configuration for Sheet Names
  const SHEETS = {
    USERS: 'USERS',
    COURSES: 'COURSES',
    ENROLLMENTS: 'ENROLLMENTS',
    ATTENDANCE: 'ATTENDANCE',
    ASSIGNMENTS: 'ASSIGNMENTS',
    SUBMISSIONS: 'SUBMISSIONS',
    PAYMENTS: 'PAYMENTS'
  };

  // Mock Database for Local Testing (Node.js environment)
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
   * Helper to determine environment and get sheet or mock data.
   */
  function _getData(sheetName) {
    if (typeof SpreadsheetApp === 'undefined') {
      return MOCK_DB[sheetName];
    } else {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var data = sheet.getDataRange().getValues();
      var headers = data.shift(); // Remove headers
      return data.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
    }
  }

  /**
   * Helper to append row
   */
  function _appendRow(sheetName, rowObject) {
    if (typeof SpreadsheetApp === 'undefined') {
      if (!MOCK_DB[sheetName]) MOCK_DB[sheetName] = [];
      MOCK_DB[sheetName].push(rowObject);
      return true;
    } else {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var rowArray = headers.map(h => rowObject[h] || '');
      sheet.appendRow(rowArray);
      return true;
    }
  }

  return {
    // --- USERS ---
    getUserByEmail: function(email) {
      var users = _getData(SHEETS.USERS);
      return users.find(u => u.email === email);
    },

    getUserByPhone: function(phone) {
      var users = _getData(SHEETS.USERS);
      return users.find(u => u.phone === phone);
    },

    createUser: function(userData) {
      userData.status = userData.status || 'ACTIVE';
      return _appendRow(SHEETS.USERS, userData);
    },

    // --- COURSES ---
    getCoursesByLevel: function(level) {
      var courses = _getData(SHEETS.COURSES);
      return courses.filter(c => c.level == level);
    },

    getAllCourses: function() {
      return _getData(SHEETS.COURSES);
    },

    // --- ENROLLMENTS ---
    getEnrollmentsByStudent: function(studentId) {
      var enrollments = _getData(SHEETS.ENROLLMENTS);
      return enrollments.filter(e => e.student_id === studentId);
    },

    enrollStudent: function(enrollData) {
      enrollData.status = 'ENROLLED';
      enrollData.final_grade = 0;
      enrollData.final_point = 0;
      return _appendRow(SHEETS.ENROLLMENTS, enrollData);
    },

    // --- ATTENDANCE ---
    getAttendanceByStudentAndCourse: function(studentId, courseId) {
      var att = _getData(SHEETS.ATTENDANCE);
      return att.filter(a => a.student_id === studentId && a.course_id === courseId);
    },

    addAttendance: function(data) {
       return _appendRow(SHEETS.ATTENDANCE, data);
    },

    // --- ASSIGNMENTS & SUBMISSIONS ---
    getAssignmentsByCourse: function(courseId) {
      var asses = _getData(SHEETS.ASSIGNMENTS);
      return asses.filter(a => a.course_id === courseId);
    },

    getSubmissionsByStudentAndCourse: function(studentId, courseId) {
      var assignments = this.getAssignmentsByCourse(courseId);
      var assignmentIds = assignments.map(a => a.assignment_id);

      var allSubs = _getData(SHEETS.SUBMISSIONS);
      return allSubs.filter(s => s.student_id === studentId && assignmentIds.includes(s.assignment_id));
    },

    addSubmission: function(data) {
      return _appendRow(SHEETS.SUBMISSIONS, data);
    },

    // --- GENERIC (For Finance/Other) ---
    // Exposing generic append for controllers that might need it (like Finance)
    // though dedicated methods are better.
    _appendRow: _appendRow,

    // --- TESTING UTILS ---
    _resetMock: function() {
      MOCK_DB = {
        USERS: [],
        COURSES: [],
        ENROLLMENTS: [],
        ATTENDANCE: [],
        ASSIGNMENTS: [],
        SUBMISSIONS: [],
        PAYMENTS: []
      };
    },

    _seedMock: function(data) {
      MOCK_DB = data;
    }
  };

})();

if (typeof module !== 'undefined') {
  module.exports = DatabaseWrapper;
}
