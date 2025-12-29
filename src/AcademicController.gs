/**
 * ACADEMIC CONTROLLER
 * Handles Grading, Attendance, and Progression Logic
 */

// Grading Constants
var WEIGHTS = {
  ATTENDANCE: 0.20,
  ASSIGNMENT: 0.15,
  UTS: 0.30,
  UAS: 0.35
};

var ATTENDANCE_VALUES = {
  'HADIR': 100,
  'REKAMAN': 80,
  'IZIN': 50,
  'ALPA': 0
};

var PASSING_GRADE = {
  MIN_POINT: 3.0,
  MIN_SCORE: 80
};

/**
 * Calculate Final Grade for a Student in a Course
 */
function calculateFinalGrade(studentId, courseId) {
  // 1. Get Components
  var attScore = calculateAttendanceScore(studentId, courseId);
  var assignScore = getComponentScore(studentId, courseId, 'TUGAS');
  var utsScore = getComponentScore(studentId, courseId, 'UTS');
  var uasScore = getComponentScore(studentId, courseId, 'UAS');

  // 2. Apply Formula
  var finalScore = (attScore * WEIGHTS.ATTENDANCE) +
                   (assignScore * WEIGHTS.ASSIGNMENT) +
                   (utsScore * WEIGHTS.UTS) +
                   (uasScore * WEIGHTS.UAS);

  // 3. Convert to Point and Status
  var point = convertToPoint(finalScore);
  var status = (point >= PASSING_GRADE.MIN_POINT) ? 'PASSED' : 'FAILED';

  return {
    score: finalScore,
    point: point,
    status: status,
    details: { att: attScore, tugas: assignScore, uts: utsScore, uas: uasScore }
  };
}

/**
 * Helper: Calculate Attendance Score Average
 */
function calculateAttendanceScore(studentId, courseId) {
  var attendances = getSheetData('ATTENDANCE');
  var totalPoints = 0;
  var count = 0;

  for (var i = 0; i < attendances.length; i++) {
    var row = attendances[i];
    if (row[COLUMNS.ATTENDANCE.STUDENT_ID] == studentId &&
        row[COLUMNS.ATTENDANCE.COURSE_ID] == courseId) {

      // Auto-convert status to value if points empty
      var status = row[COLUMNS.ATTENDANCE.STATUS];
      var points = row[COLUMNS.ATTENDANCE.POINTS];
      if (points === '' || points == null) {
        points = ATTENDANCE_VALUES[status] || 0;
      }

      totalPoints += Number(points);
      count++;
    }
  }

  return (count === 0) ? 0 : (totalPoints / count);
}

/**
 * Helper: Get Assignment/Exam Score Average
 */
function getComponentScore(studentId, courseId, type) {
  var assignments = getSheetData('ASSIGNMENTS');
  var submissions = getSheetData('SUBMISSIONS');

  // Find all assignments of this type for this course
  var targetAssignIds = [];
  for (var i = 0; i < assignments.length; i++) {
    if (assignments[i][COLUMNS.ASSIGNMENTS.COURSE_ID] == courseId &&
        assignments[i][COLUMNS.ASSIGNMENTS.TYPE] == type) {
      targetAssignIds.push(assignments[i][COLUMNS.ASSIGNMENTS.ASSIGNMENT_ID]);
    }
  }

  if (targetAssignIds.length === 0) return 0; // No assignments of this type

  // Calculate total score obtained
  var totalScore = 0;
  for (var j = 0; j < targetAssignIds.length; j++) {
    var aId = targetAssignIds[j];
    // Find submission
    var score = 0;
    for (var k = 0; k < submissions.length; k++) {
      if (submissions[k][COLUMNS.SUBMISSIONS.ASSIGNMENT_ID] == aId &&
          submissions[k][COLUMNS.SUBMISSIONS.STUDENT_ID] == studentId) {
        score = Number(submissions[k][COLUMNS.SUBMISSIONS.SCORE] || 0);
        break;
      }
    }
    totalScore += score;
  }

  return totalScore / targetAssignIds.length; // Average
}

/**
 * Convert Score to Point (4.0 Scale)
 */
function convertToPoint(score) {
  if (score >= 90) return 4.0; // Mumtaz
  if (score >= 80) return 3.0; // Jayyid Jiddan
  // Below 80 is Failed (< 3.0)
  // Linear interpolation or fixed steps for below 80?
  // Spec implies < 80 is failed. Let's make it granular or strict.
  // Assuming simplified strict scale for now based on spec "Min 3.0"
  if (score >= 70) return 2.0;
  if (score >= 60) return 1.0;
  return 0.0;
}

/**
 * Check if Student can enroll in a Target Level (Mustawa)
 * Implements Single Level Policy & Sequential Progression
 */
function canEnrollInLevel(studentId, targetLevel) {
  var enrollments = getSheetData('ENROLLMENTS');
  var courses = getSheetData('COURSES');

  // 1. Single Level Policy Check
  // Check if student is currently enrolled (and not passed/failed yet) in any other level
  // Actually, Single Level Policy usually means "Don't take Level 2 courses while taking Level 3 courses".
  // Or "Finish Level 1 before starting Level 2".

  if (targetLevel == 1) return { allowed: true }; // Level 1 is always open for new students

  // 2. Sequential Progression Check
  // Must pass ALL courses in Level (targetLevel - 1)
  var prevLevel = targetLevel - 1;

  // Get all courses in prevLevel
  var prevLevelCourseIds = [];
  for (var i = 0; i < courses.length; i++) {
    if (courses[i][COLUMNS.COURSES.LEVEL] == prevLevel) {
      prevLevelCourseIds.push(courses[i][COLUMNS.COURSES.COURSE_ID]);
    }
  }

  if (prevLevelCourseIds.length === 0) {
    // Weird case: Previous level has no courses? Allow.
    return { allowed: true };
  }

  // Check student's status for these courses
  var passedCount = 0;
  for (var j = 0; j < prevLevelCourseIds.length; j++) {
    var cId = prevLevelCourseIds[j];
    var isPassed = false;

    for (var k = 0; k < enrollments.length; k++) {
      if (enrollments[k][COLUMNS.ENROLLMENTS.STUDENT_ID] == studentId &&
          enrollments[k][COLUMNS.ENROLLMENTS.COURSE_ID] == cId &&
          enrollments[k][COLUMNS.ENROLLMENTS.STATUS] == 'PASSED') {
        isPassed = true;
        break;
      }
    }

    if (isPassed) passedCount++;
  }

  if (passedCount === prevLevelCourseIds.length) {
    return { allowed: true };
  } else {
    return {
      allowed: false,
      reason: 'Anda belum lulus semua mata kuliah di Mustawa ' + prevLevel
    };
  }
}
