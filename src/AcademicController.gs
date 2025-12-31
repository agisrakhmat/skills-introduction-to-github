/**
 * AcademicController.gs
 * Handles Grading, Attendance, and Mustawa Progression Logic.
 */

if (typeof DatabaseWrapper === 'undefined' && typeof require !== 'undefined') {
  var DatabaseWrapper = require('./DatabaseWrapper.gs');
}

var AcademicController = (function() {

  // --- CONSTANTS ---
  const PASSING_POINT = 3.0;
  const ATTENDANCE_WEIGHT = 0.20;
  const ASSIGNMENT_WEIGHT = 0.15;
  const UTS_WEIGHT = 0.30;
  const UAS_WEIGHT = 0.35;

  const ATTENDANCE_SCORES = {
    'HADIR': 100,
    'REKAMAN': 80,
    'IZIN': 50,
    'ALPA': 0
  };

  /**
   * Calculates the final grade for a student in a specific course.
   * Returns object with grade details.
   */
  function calculateGrade(studentId, courseId) {
    // 1. Calculate Attendance Score
    var attendanceRecords = DatabaseWrapper.getAttendanceByStudentAndCourse(studentId, courseId);
    var totalAttendancePoints = 0;
    var maxAttendancePoints = attendanceRecords.length * 100; // Assuming max score is 100 per session

    // If no sessions yet, avoid division by zero
    var finalAttendanceScore = 0;
    if (attendanceRecords.length > 0) {
      attendanceRecords.forEach(r => {
        totalAttendancePoints += (ATTENDANCE_SCORES[r.status] || 0);
      });
      finalAttendanceScore = (totalAttendancePoints / maxAttendancePoints) * 100;
    }

    // 2. Calculate Assignment, UTS, UAS Scores
    var assignments = DatabaseWrapper.getAssignmentsByCourse(courseId);
    var submissions = DatabaseWrapper.getSubmissionsByStudentAndCourse(studentId, courseId);

    var taskTotal = 0, taskCount = 0;
    var utsScore = 0;
    var uasScore = 0;

    assignments.forEach(assign => {
      var sub = submissions.find(s => s.assignment_id === assign.assignment_id);
      var score = sub ? sub.score : 0; // 0 if not submitted

      if (assign.type === 'TUGAS') {
        taskTotal += score;
        taskCount++;
      } else if (assign.type === 'UTS') {
        utsScore = score;
      } else if (assign.type === 'UAS') {
        uasScore = score;
      }
    });

    var avgTaskScore = taskCount > 0 ? (taskTotal / taskCount) : 0;

    // 3. Final Formula
    var finalScore = (finalAttendanceScore * ATTENDANCE_WEIGHT) +
                     (avgTaskScore * ASSIGNMENT_WEIGHT) +
                     (utsScore * UTS_WEIGHT) +
                     (uasScore * UAS_WEIGHT);

    // 4. Point Conversion
    var finalPoint = 0.0;
    var passed = false;

    if (finalScore >= 90) finalPoint = 4.0;
    else if (finalScore >= 80) finalPoint = 3.0;
    else finalPoint = (finalScore / 100) * 3.0; // Simplification

    // Strict rule: < 80 is < 3.0 -> FAIL.
    if (finalScore < 80) {
        finalPoint = (finalScore / 80) * 2.99;
    }

    if (finalPoint >= PASSING_POINT) {
      passed = true;
    }

    return {
      finalScore: finalScore,
      finalPoint: finalPoint,
      passed: passed,
      details: {
        att: finalAttendanceScore,
        task: avgTaskScore,
        uts: utsScore,
        uas: uasScore
      }
    };
  }

  /**
   * Checks if a student can enroll in a target level (Mustawa).
   * Enforces Single Level Policy and Sequential Progression.
   */
  function canEnrollInLevel(studentId, targetLevel) {
    // 1. Get all student enrollments
    var allEnrollments = DatabaseWrapper.getEnrollmentsByStudent(studentId);
    var allCourses = DatabaseWrapper.getAllCourses();

    // Map enrollments to course details
    var studentHistory = allEnrollments.map(e => {
      var course = allCourses.find(c => c.course_id === e.course_id);
      return {
        ...e,
        level: course ? course.level : 0
      };
    });

    // Rule: Single Level Policy
    // Check if currently enrolled in another level (Status = ENROLLED)
    var activeEnrollments = studentHistory.filter(e => e.status === 'ENROLLED');
    if (activeEnrollments.length > 0) {
      var currentLevel = activeEnrollments[0].level;
      if (currentLevel !== targetLevel) {
        return {
          allowed: false,
          reason: "Single Level Policy: You are currently active in Level " + currentLevel
        };
      }
    }

    // Rule: Sequential Progression (Target Level > 1)
    if (targetLevel > 1) {
      var prevLevel = targetLevel - 1;

      // Get all courses for previous level
      var prevLevelCourses = DatabaseWrapper.getCoursesByLevel(prevLevel);

      // Check if ALL previous level courses are PASSED
      var allPassed = prevLevelCourses.every(c => {
        var enrollment = studentHistory.find(h => h.course_id === c.course_id);
        // Must exist AND be passed
        return enrollment && enrollment.final_point >= PASSING_POINT;
      });

      if (!allPassed) {
        return {
          allowed: false,
          reason: "Sequential Progression: You must pass all courses in Level " + prevLevel
        };
      }
    }

    return { allowed: true };
  }

  return {
    calculateGrade: calculateGrade,
    canEnrollInLevel: canEnrollInLevel
  };

})();

if (typeof module !== 'undefined') {
  module.exports = AcademicController;
}
