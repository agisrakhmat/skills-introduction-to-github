// src/Student.js

// Ensure dependencies
if (typeof Database === 'undefined') {
  if (typeof require !== 'undefined') {
    var Database = require('./Database');
    var Utils = require('./Utils');
    var Config = require('./Config');
  } else {
    throw new Error('Dependencies not loaded');
  }
}

var Student = {
  // Get summary for dashboard
  getDashboardData: function(userId) {
    var user = Database.findUser(userId);
    if (!user) return Utils.createResponse(false, 'User not found');

    // Get current Mustawa (Level)
    // Defined by the highest level they are enrolled in OR the next available level
    // For simplicity: Find max level of enrolled courses.
    var enrollments = this._getEnrollments(userId);
    var currentLevel = 0;

    // Logic to determine level:
    // If has enrollments, take the level of active enrollments.
    // If no active enrollments, look at passed courses to see what's next.

    // Let's simplified: Level is stored in User Profile? No, schema doesn't have it.
    // So we deduce from Enrollments.

    var courses = Database.getData(Config.SHEET_COURSES);
    var courseMap = {};
    for (var c of courses) courseMap[c.course_id] = c;

    var activeLevels = [];
    var maxPassedLevel = 0;

    for (var e of enrollments) {
        var course = courseMap[e.course_id];
        if (!course) continue;

        var lvl = parseInt(course.level);
        if (e.status === 'ENROLLED') {
            if (activeLevels.indexOf(lvl) === -1) activeLevels.push(lvl);
        } else if (e.status === 'PASSED') {
            if (lvl > maxPassedLevel) maxPassedLevel = lvl;
        }
    }

    if (activeLevels.length > 0) {
        currentLevel = Math.max.apply(null, activeLevels);
    } else {
        currentLevel = maxPassedLevel + 1;
    }

    return Utils.createResponse(true, 'Dashboard Data', {
      user: {
        full_name: user.full_name,
        user_id: user.user_id,
        role: user.role,
        status: user.status
      },
      current_mustawa: currentLevel,
      enrollment_count: enrollments.length
    });
  },

  getEnrolledCourses: function(userId) {
    var enrollments = this._getEnrollments(userId);
    var courses = Database.getData(Config.SHEET_COURSES);
    var lecturers = Database.getData(Config.SHEET_USERS); // To get lecturer names

    var lecturerMap = {};
    for (var u of lecturers) lecturerMap[u.user_id] = u.full_name;

    var result = [];
    for (var e of enrollments) {
        // Find course
        var course = null;
        for (var c of courses) {
            if (c.course_id === e.course_id) {
                course = c;
                break;
            }
        }

        if (course) {
            result.push({
                course_id: course.course_id,
                name: course.name,
                level: course.level,
                sks: course.sks,
                lecturer: lecturerMap[course.lecturer_id] || 'Unknown',
                status: e.status,
                final_grade: e.final_grade,
                schedule_day: course.schedule_day || 'TBA', // Assumption: stored in course or separate
                schedule_time: course.schedule_time || 'TBA'
            });
        }
    }

    return Utils.createResponse(true, 'Enrolled Courses', result);
  },

  // Submit Attendance
  submitAttendance: function(userId, courseId, sessionDate, status) {
    // Check if enrolled
    var enrollments = this._getEnrollments(userId);
    var isEnrolled = false;
    for (var e of enrollments) {
        if (e.course_id === courseId && e.status === 'ENROLLED') {
            isEnrolled = true;
            break;
        }
    }

    if (!isEnrolled) return Utils.createResponse(false, 'Not enrolled in this course');

    // Check if already submitted for this date?
    // We need to query ATTENDANCE sheet
    var attendanceData = Database.getData(Config.SHEET_ATTENDANCE);
    var existingRecord = null;

    // Need to handle Date comparison carefully
    var targetDate = Utils.formatDate(sessionDate); // Ensure string YYYY-MM-DD

    for (var a of attendanceData) {
        if (a.student_id === userId && a.course_id === courseId && Utils.formatDate(a.session_date) === targetDate) {
            existingRecord = a;
            break;
        }
    }

    if (existingRecord) {
        return Utils.createResponse(false, 'Attendance already submitted for this date');
    }

    // Calculate points
    var points = 0;
    if (status === 'HADIR') points = 100;
    else if (status === 'REKAMAN') points = 80;
    else if (status === 'IZIN') points = 50;
    else points = 0;

    var newRecord = [
        'ATT' + new Date().getTime(),
        courseId,
        userId,
        sessionDate, // Should be date object or string? DB stores it.
        status,
        points
    ];

    Database.appendRow(Config.SHEET_ATTENDANCE, newRecord);
    return Utils.createResponse(true, 'Attendance submitted');
  },

  // Helper
  _getEnrollments: function(userId) {
    var allEnrollments = Database.getData(Config.SHEET_ENROLLMENTS);
    var userEnrollments = [];
    for (var i = 0; i < allEnrollments.length; i++) {
      if (allEnrollments[i].student_id === userId) {
        userEnrollments.push(allEnrollments[i]);
      }
    }
    return userEnrollments;
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Student;
}
