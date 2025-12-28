// src/BusinessLogic.gs

/**
 * Calculates the Final Score and Status for an enrollment
 */
function calculateGrade(enrollmentId) {
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var enrollment = enrollments.find(function(e) { return e.enrollment_id == enrollmentId; });

  if (!enrollment) return { error: "Enrollment not found" };

  var courseId = enrollment.course_id;
  var studentId = enrollment.student_id;

  // 1. Calculate Attendance Score
  var attendanceRecords = getData(CONFIG.SHEET_NAMES.ATTENDANCE).filter(function(a) {
    return a.course_id == courseId && a.student_id == studentId;
  });

  var totalAttendancePoints = 0;

  if (attendanceRecords.length > 0) {
    attendanceRecords.forEach(function(r) {
      var points = 0;
      if (r.status === "HADIR") points = CONFIG.ATTENDANCE_SCORES.HADIR;
      else if (r.status === "REKAMAN") points = CONFIG.ATTENDANCE_SCORES.REKAMAN;
      else if (r.status === "IZIN") points = CONFIG.ATTENDANCE_SCORES.IZIN;
      else if (r.status === "ALPA") points = CONFIG.ATTENDANCE_SCORES.ALPA;

      totalAttendancePoints += points;
    });
    // Average attendance score 0-100
    var attendanceScore = totalAttendancePoints / attendanceRecords.length;
  } else {
    var attendanceScore = 0;
  }

  // 2. Calculate Assignment, UTS, UAS Scores
  var submissions = getData(CONFIG.SHEET_NAMES.SUBMISSIONS).filter(function(s) {
    return s.student_id == studentId;
  });

  var assignments = getData(CONFIG.SHEET_NAMES.ASSIGNMENTS).filter(function(a) {
    return a.course_id == courseId;
  });

  var taskScore = 0, taskCount = 0;
  var utsScore = 0;
  var uasScore = 0;

  assignments.forEach(function(assignment) {
    // Find submission
    var sub = submissions.find(function(s) { return s.assignment_id == assignment.assignment_id; });
    var score = sub ? sub.score : 0;

    // Normalize to 0-100 if max_score is different (Assuming max_score provided, else 100)
    var max = assignment.max_score || 100;
    var normalizedScore = (score / max) * 100;

    if (assignment.type === "TUGAS") {
      taskScore += normalizedScore;
      taskCount++;
    } else if (assignment.type === "UTS") {
      utsScore = normalizedScore; // Assuming 1 UTS
    } else if (assignment.type === "UAS") {
      uasScore = normalizedScore; // Assuming 1 UAS
    }
  });

  var finalTaskScore = taskCount > 0 ? (taskScore / taskCount) : 0;

  // 3. Apply Formula
  // Final Score = (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)
  var finalScore = (attendanceScore * CONFIG.WEIGHTS.ATTENDANCE) +
                   (finalTaskScore * CONFIG.WEIGHTS.ASSIGNMENT) +
                   (utsScore * CONFIG.WEIGHTS.UTS) +
                   (uasScore * CONFIG.WEIGHTS.UAS);

  // 4. Convert to Point and Status
  var finalPoint = 0.0;
  var status = "FAILED";

  // Grade >= 80 is Passing (3.0 or 4.0)
  if (finalScore >= 90) {
    finalPoint = 4.0;
    status = "PASSED";
  } else if (finalScore >= 80) {
    finalPoint = 3.0;
    status = "PASSED";
  } else {
    // Below 80 is failed based on "Passing Grade: Nilai Poin minimal adalah 3.0"
    // and "< 80 : < 3.0 -> GAGAL"
    finalPoint = 0.0; // Or calculate actual GPA? Spec implies binary Pass/Fail for progression
    status = "FAILED";
  }

  // Update Enrollment
  updateData(CONFIG.SHEET_NAMES.ENROLLMENTS, "enrollment_id", enrollmentId, {
    final_grade: finalScore,
    final_point: finalPoint,
    status: status
  });

  return {
    enrollment_id: enrollmentId,
    final_grade: finalScore,
    final_point: finalPoint,
    status: status
  };
}

/**
 * Checks if a student can enroll in a specific course (Mustawa Logic)
 */
function canEnroll(studentId, courseId) {
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var targetCourse = courses.find(function(c) { return c.course_id == courseId; });

  if (!targetCourse) return { allowed: false, reason: "Course not found" };

  var targetLevel = targetCourse.level;

  // 1. Single Level Policy: Mahasiswa hanya boleh mengambil mata kuliah di satu Mustawa pada waktu yang sama.
  // Check active enrollments (status ENROLLED)
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var activeEnrollments = enrollments.filter(function(e) {
    return e.student_id == studentId && e.status === "ENROLLED";
  });

  // Find levels of active courses
  var activeLevels = [];
  activeEnrollments.forEach(function(e) {
    var c = courses.find(function(cx) { return cx.course_id == e.course_id; });
    if (c && activeLevels.indexOf(c.level) === -1) {
      activeLevels.push(c.level);
    }
  });

  if (activeLevels.length > 0) {
    // If attempting a different level than currently active
    if (activeLevels[0] !== targetLevel) {
       return { allowed: false, reason: "Single Level Policy: You have active courses in Level " + activeLevels[0] };
    }
  }

  // 2. Sequential Progression: Must pass all N to unlock N+1
  if (targetLevel > 1) {
    var previousLevel = targetLevel - 1;
    // Get all courses in previous level
    var prevLevelCourses = courses.filter(function(c) { return c.level == previousLevel; });

    // Check if student passed ALL of them
    var studentHistory = enrollments.filter(function(e) { return e.student_id == studentId; });

    var allPassed = prevLevelCourses.every(function(course) {
      // FIX: Use .some() to check if *any* record for this course is PASSED.
      // This accounts for retakes where earlier attempts might be FAILED.
      var hasPassed = studentHistory.some(function(h) {
        return h.course_id == course.course_id && h.status === "PASSED" && h.final_point >= CONFIG.PASSING_GRADE;
      });
      return hasPassed;
    });

    if (!allPassed) {
      return { allowed: false, reason: "Sequential Progression: You must pass all courses in Level " + previousLevel };
    }
  }

  return { allowed: true };
}

function enrollStudent(studentId, courseId) {
  var check = canEnroll(studentId, courseId);
  if (!check.allowed) {
    return { success: false, message: check.reason };
  }

  // Check if already enrolled
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var exists = enrollments.find(function(e) {
    return e.student_id == studentId && e.course_id == courseId && e.status == "ENROLLED";
  });

  if (exists) {
     return { success: false, message: "Already enrolled" };
  }

  insertData(CONFIG.SHEET_NAMES.ENROLLMENTS, {
    enrollment_id: generateId(),
    student_id: studentId,
    course_id: courseId,
    final_grade: 0,
    final_point: 0,
    status: "ENROLLED"
  });

  return { success: true, message: "Enrolled successfully" };
}
