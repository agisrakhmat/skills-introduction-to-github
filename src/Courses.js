// Import dependencies if running in Node.js
if (typeof require !== 'undefined') {
  var Database = require('./Database');
  var Config = require('./Config');
}

var Courses = {

  /**
   * Check if a student can enroll in a specific course.
   * Logic:
   * 1. Single Level Policy: Can only take courses from one level at a time.
   * 2. Sequential Progression: Level N+1 locked until Level N is passed.
   */
  canEnroll: function(studentId, courseLevel) {
    // 1. Get student's current enrollments
    var enrollments = this._getStudentEnrollments(studentId);

    // Check Active Enrollments (Not Passed/Failed yet, currently studying)
    var activeLevels = new Set();
    for (var i = 0; i < enrollments.length; i++) {
      var enr = enrollments[i];
      if (enr.status === Config.ENROLLMENT_STATUS.ENROLLED) {
        var course = this._getCourseById(enr.course_id);
        if (course) {
          activeLevels.add(course.level);
        }
      }
    }

    // Rule A: Single Level Policy
    // If student has active courses in Level X, they cannot take Level Y.
    // Unless Level Y == Level X.
    if (activeLevels.size > 0) {
      if (!activeLevels.has(courseLevel)) {
        return {
          allowed: false,
          reason: "Single Level Policy: You are currently active in Level " + Array.from(activeLevels).join(',')
        };
      }
    }

    // Rule B: Sequential Progression
    // To take Level N, must pass all courses in Level N-1.
    if (courseLevel > 1) {
      var prevLevel = courseLevel - 1;
      var passedPrevLevel = this._hasPassedLevel(studentId, prevLevel);
      if (!passedPrevLevel) {
        return {
          allowed: false,
          reason: "Sequential Progression: You must complete Level " + prevLevel + " first."
        };
      }
    }

    return { allowed: true };
  },

  /**
   * Helper: Get all enrollments for a student.
   * (Mock implementation logic needed here depending on DB)
   */
  _getStudentEnrollments: function(studentId) {
    var ss = Database._getSpreadsheet();
    if (!ss) return []; // Mock empty for basic test unless injected

    // In real GAS, we would query the ENROLLMENTS sheet.
    // Simplifying for now: Real implementation requires filtering ENROLLMENTS sheet.
    var sheet = ss.getSheetByName(Database.SHEETS.ENROLLMENTS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var results = [];
    var headers = Database.SCHEMA.ENROLLMENTS;

    // Simple filter
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // map row to object
      var obj = Database._rowToObject(Database.SHEETS.ENROLLMENTS, row);
      if (obj.student_id === studentId) {
        results.push(obj);
      }
    }
    return results;
  },

  /**
   * Helper: Get course details by ID.
   */
  _getCourseById: function(courseId) {
    var ss = Database._getSpreadsheet();
    if (!ss) return null;

    var sheet = ss.getSheetByName(Database.SHEETS.COURSES);
    if (!sheet) return null;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
       var obj = Database._rowToObject(Database.SHEETS.COURSES, data[i]);
       if (obj.course_id === courseId) return obj;
    }
    return null;
  },

  /**
   * Helper: Check if student passed all courses in a level.
   */
  _hasPassedLevel: function(studentId, level) {
    // 1. Find all courses in that level
    var allCoursesInLevel = this._getCoursesByLevel(level);
    if (allCoursesInLevel.length === 0) return true; // Level doesn't exist? Assume pass.

    // 2. Check if student passed EACH of them
    var enrollments = this._getStudentEnrollments(studentId);

    for (var i = 0; i < allCoursesInLevel.length; i++) {
      var course = allCoursesInLevel[i];
      var passed = false;

      for (var j = 0; j < enrollments.length; j++) {
        var enr = enrollments[j];
        if (enr.course_id === course.course_id && enr.status === Config.ENROLLMENT_STATUS.PASSED) {
          passed = true;
          break;
        }
      }

      if (!passed) return false; // Found a course in this level not passed
    }

    return true;
  },

  _getCoursesByLevel: function(level) {
    var ss = Database._getSpreadsheet();
    if (!ss) return [];

    var sheet = ss.getSheetByName(Database.SHEETS.COURSES);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = 1; i < data.length; i++) {
       var obj = Database._rowToObject(Database.SHEETS.COURSES, data[i]);
       if (obj.level == level) results.push(obj);
    }
    return results;
  }
};

if (typeof module !== 'undefined') {
  module.exports = Courses;
}
