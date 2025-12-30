/**
 * AcademicController.gs
 * Handles Academic logic: Grading, Attendance, Dashboard Data.
 */

var AcademicController = {

  /**
   * Retrieves dashboard data for a student.
   * - Profile info
   * - Current Enrollments & Status
   * - Academic Summary (GPA/Grade per Mustawa)
   */
  getStudentDashboard: function(studentId) {
    var student = findRow(TABLES.USERS, 'user_id', studentId);
    if (!student) return { status: 'error', message: 'Student not found' };

    // Get Enrollments
    var enrollments = findRows(TABLES.ENROLLMENTS, 'student_id', studentId);

    // Enrich enrollments with Course Info
    var activeCourses = [];
    var transcript = {}; // Group by Level

    enrollments.forEach(function(enrol) {
      var course = findRow(TABLES.COURSES, 'course_id', enrol.course_id);
      if (course) {
        var data = {
          course_id: course.course_id,
          name: course.name,
          level: course.level,
          sks: course.sks,
          status: enrol.status,
          final_grade: enrol.final_grade,
          final_point: enrol.final_point
        };

        if (enrol.status === 'ENROLLED') {
          activeCourses.push(data);
        }

        // Build Transcript structure
        if (!transcript[course.level]) transcript[course.level] = [];
        transcript[course.level].push(data);
      }
    });

    return {
      status: 'success',
      data: {
        student: {
            full_name: student.full_name,
            status: student.status,
            id: student.user_id
        },
        active_courses: activeCourses,
        transcript: transcript
      }
    };
  },

  /**
   * Enrolls a student in a course.
   * Enforces Mustawa logic:
   * 1. Single Level Policy: Cannot mix levels.
   * 2. Sequential Progression: Must pass Level N before N+1.
   */
  enrollCourse: function(studentId, courseId) {
      var student = findRow(TABLES.USERS, 'user_id', studentId);
      if (!student) return { status: 'error', message: 'Student not found' };

      var course = findRow(TABLES.COURSES, 'course_id', courseId);
      if (!course) return { status: 'error', message: 'Course not found' };

      // Check if already enrolled
      var existingEnrollment = findRows(TABLES.ENROLLMENTS, 'student_id', studentId).find(function(e) {
          return e.course_id === courseId;
      });
      if (existingEnrollment) return { status: 'error', message: 'Already enrolled' };

      // --- Mustawa Logic ---
      var targetLevel = course.level;
      var enrollments = findRows(TABLES.ENROLLMENTS, 'student_id', studentId);
      var courses = readTable(TABLES.COURSES); // Load all courses for checking

      // 1. Single Level Policy
      // Check active enrollments (status ENROLLED)
      // They must all be of the same level as targetLevel
      var activeEnrollments = enrollments.filter(function(e) { return e.status === 'ENROLLED'; });

      for (var i = 0; i < activeEnrollments.length; i++) {
          var c = courses.find(function(co) { return co.course_id === activeEnrollments[i].course_id; });
          if (c && c.level !== targetLevel) {
              return { status: 'error', message: 'Cannot take courses from different levels simultaneously. Active Level: ' + c.level };
          }
      }

      // 2. Sequential Progression
      // If targetLevel > 1, check if ALL courses in targetLevel-1 are PASSED
      if (targetLevel > 1) {
          var prevLevel = targetLevel - 1;
          var prevLevelCourses = courses.filter(function(c) { return c.level === prevLevel; });

          if (prevLevelCourses.length === 0) {
              // Edge case: No courses defined for previous level? Allow or Block?
              // Assuming config error, but let's allow if no prereqs exist.
          } else {
              // Check if student has PASSED all of them
              var allPassed = prevLevelCourses.every(function(plc) {
                  var enr = enrollments.find(function(e) { return e.course_id === plc.course_id; });
                  // Must exist and be PASSED
                  return enr && enr.status === 'PASSED';
              });

              if (!allPassed) {
                  return { status: 'error', message: 'Must pass all courses in Level ' + prevLevel + ' first.' };
              }
          }
      }

      // Proceed to Enroll
      var enrollmentId = 'ENR.' + studentId + '.' + courseId + '.' + new Date().getTime(); // Simple ID gen
      var newEnrollment = {
          enrollment_id: enrollmentId,
          student_id: studentId,
          course_id: courseId,
          final_grade: 0,
          final_point: 0,
          status: 'ENROLLED'
      };

      appendRow(TABLES.ENROLLMENTS, newEnrollment);
      return { status: 'success', message: 'Enrolled successfully', data: newEnrollment };
  },

  /**
   * Calculates Final Grade based on components.
   * Formula: (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)
   */
  calculateFinalGrade: function(enrollmentId) {
    var enrollment = findRow(TABLES.ENROLLMENTS, 'enrollment_id', enrollmentId);
    if (!enrollment) return { status: 'error', message: 'Enrollment not found' };

    var studentId = enrollment.student_id;
    var courseId = enrollment.course_id;

    // 1. Calculate Attendance Score
    // HADIR=100, REKAMAN=80, IZIN=50, ALPA=0
    var attendances = findRows(TABLES.ATTENDANCE, 'course_id', courseId).filter(function(a) {
        return a.student_id === studentId;
    });

    var totalAttendanceScore = 0;
    var sessionCount = attendances.length; // Or total sessions in course if we knew it. Assuming dynamic.

    // If we rely on stored 'points' in ATTENDANCE table
    // or calculate on fly:
    if (sessionCount > 0) {
        var sumPoints = attendances.reduce(function(sum, a) {
            var p = 0;
            if (a.status === 'HADIR') p = 100;
            else if (a.status === 'REKAMAN') p = 80;
            else if (a.status === 'IZIN') p = 50;
            else p = 0;
            return sum + p;
        }, 0);
        totalAttendanceScore = sumPoints / sessionCount;
    }

    // 2. Assignments (Tugas)
    // Find all assignments of type TUGAS
    var assignments = findRows(TABLES.ASSIGNMENTS, 'course_id', courseId).filter(function(a) {
        return a.type === 'TUGAS';
    });

    var assignmentScore = this._calculateComponentScore(assignments, studentId);

    // 3. UTS
    var uts = findRows(TABLES.ASSIGNMENTS, 'course_id', courseId).filter(function(a) {
        return a.type === 'UTS';
    });
    var utsScore = this._calculateComponentScore(uts, studentId);

    // 4. UAS
    var uas = findRows(TABLES.ASSIGNMENTS, 'course_id', courseId).filter(function(a) {
        return a.type === 'UAS';
    });
    var uasScore = this._calculateComponentScore(uas, studentId);

    // Final Formula
    var finalScore = (totalAttendanceScore * 0.20) +
                     (assignmentScore * 0.15) +
                     (utsScore * 0.30) +
                     (uasScore * 0.35);

    // Convert to Point
    var point = 0;
    if (finalScore >= 90) point = 4.0;
    else if (finalScore >= 80) point = 3.0;
    else point = 0.0; // Per spec: < 80 is < 3.0 -> GAGAL. We can treat anything < 80 as 0.0 or actual scale if provided.
    // Spec: "Jika Poin < 3.0, status kelulusan = GAGAL".
    // Spec Example: < 80 : < 3.0 -> GAGAL.
    // Let's assume precise calculation is not given for < 80, so we just mark it failed.

    var newStatus = (point >= 3.0) ? 'PASSED' : 'FAILED';

    // Update Enrollment
    updateRow(TABLES.ENROLLMENTS, 'enrollment_id', enrollmentId, {
        final_grade: finalScore,
        final_point: point,
        status: newStatus
    });

    return {
        status: 'success',
        data: {
            final_grade: finalScore,
            final_point: point,
            status: newStatus
        }
    };
  },

  _calculateComponentScore: function(assignmentList, studentId) {
    if (assignmentList.length === 0) return 0;

    var totalScore = 0;
    var maxTotal = 0; // Or simply average of (score/max * 100)

    // Option A: Average of scores (normalized to 100)
    var sumNormalized = 0;

    assignmentList.forEach(function(assign) {
        var sub = findRows(TABLES.SUBMISSIONS, 'assignment_id', assign.assignment_id).find(function(s) {
            return s.student_id === studentId;
        });

        var score = sub ? sub.score : 0;
        var max = assign.max_score || 100;

        sumNormalized += (score / max) * 100;
    });

    return sumNormalized / assignmentList.length;
  },

  /**
   * Submits a grade for a student.
   * Can create/update Assignment and Submission dynamically if needed, or assumes Assignment exists.
   * For simplicity: Creates Assignment if not exists (one per type per course?) or requires assignment_id?
   * Spec: "Input Nilai". Usually Lecturer selects "Tugas 1", "UTS".
   * Let's simplify: Lecturer inputs "Tugas 1", Score 90.
   * We need to store this.
   */
  submitGrade: function(lecturerId, courseId, studentId, type, score) {
      // Verify course ownership
      var course = findRow(TABLES.COURSES, 'course_id', courseId);
      if (!course) return { status: 'error', message: 'Course not found' };
      // if (course.lecturer_id !== lecturerId) ... (Skip for Admin or just trust role check in router)

      // Find or Create Assignment
      // We need a way to distinguish "Tugas 1", "Tugas 2".
      // Prompt just says "Tugas * 15%".
      // Let's assume 'type' is unique per course for UTS/UAS, but multiple for TUGAS?
      // For this MVP, let's treat type as the identifier (e.g., 'UTS', 'UAS', 'TUGAS_1').

      var assignmentId = 'ASS.' + courseId + '.' + type;
      var assignment = findRow(TABLES.ASSIGNMENTS, 'assignment_id', assignmentId);

      if (!assignment) {
          assignment = {
              assignment_id: assignmentId,
              course_id: courseId,
              type: type.startsWith('TUGAS') ? 'TUGAS' : type, // Normalize type enum
              max_score: 100
          };
          appendRow(TABLES.ASSIGNMENTS, assignment);
      }

      // Update Submission
      var submissionId = 'SUB.' + assignmentId + '.' + studentId;
      var submission = findRow(TABLES.SUBMISSIONS, 'submission_id', submissionId);

      if (submission) {
          updateRow(TABLES.SUBMISSIONS, 'submission_id', submissionId, { score: score });
      } else {
          appendRow(TABLES.SUBMISSIONS, {
              submission_id: submissionId,
              assignment_id: assignmentId,
              student_id: studentId,
              score: score
          });
      }

      return { status: 'success', message: 'Grade submitted' };
  },

  updateAttendance: function(lecturerId, courseId, studentId, sessionDate, status) {
      // Check valid status
      if (['HADIR', 'REKAMAN', 'IZIN', 'ALPA'].indexOf(status) === -1) {
          return { status: 'error', message: 'Invalid status' };
      }

      var attendanceId = 'ATT.' + courseId + '.' + studentId + '.' + sessionDate;
      var existing = findRow(TABLES.ATTENDANCE, 'attendance_id', attendanceId);

      var data = {
          attendance_id: attendanceId,
          course_id: courseId,
          student_id: studentId,
          session_date: sessionDate,
          status: status,
          points: (status === 'HADIR' ? 100 : (status === 'REKAMAN' ? 80 : (status === 'IZIN' ? 50 : 0)))
      };

      if (existing) {
          updateRow(TABLES.ATTENDANCE, 'attendance_id', attendanceId, data);
      } else {
          appendRow(TABLES.ATTENDANCE, data);
      }

      return { status: 'success', message: 'Attendance updated' };
  }

};
