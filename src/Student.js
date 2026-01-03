var Student = {
  /**
   * Retrieves dashboard data for a student.
   * @param {string} studentId
   * @return {TextOutput}
   */
  getDashboardData: function(studentId) {
    var user = Users.findByLogin(studentId);
    if (!user) return Utils.createErrorResponse('User not found', 404);

    var enrollments = Enrollments.getByStudent(studentId);
    var academicData = [];
    var currentLevel = 0;

    for (var i = 0; i < enrollments.length; i++) {
      var e = enrollments[i];
      var course = Courses.getById(e.course_id);

      if (course) {
        if (course.level > currentLevel) currentLevel = course.level;

        // 1. Attendance
        var attendanceScore = Attendance.calculateAverage(studentId, course.course_id);

        // 2. Assignments & Exams
        var assignments = Assignments.getByCourse(course.course_id);
        var totalTugas = 0;
        var countTugas = 0;
        var scoreUTS = 0;
        var scoreUAS = 0;

        for (var j = 0; j < assignments.length; j++) {
          var a = assignments[j];
          var score = Submissions.getScore(a.assignment_id, studentId);

          if (a.type === 'TUGAS') {
            totalTugas += score;
            countTugas++;
          } else if (a.type === 'UTS') {
            scoreUTS = score;
          } else if (a.type === 'UAS') {
            scoreUAS = score;
          }
        }

        var avgTugas = countTugas > 0 ? (totalTugas / countTugas) : 0;

        // 3. Final Calculation
        var finalScore = Grading.calculateScore(attendanceScore, avgTugas, scoreUTS, scoreUAS);
        var finalPoint = Grading.getPoint(finalScore);
        var predicate = Grading.getPredicate(finalPoint);
        var passed = Grading.isPassed(finalPoint);

        academicData.push({
          course_id: course.course_id,
          course_name: course.name,
          level: course.level,
          sks: course.sks,
          scores: {
            attendance: attendanceScore,
            assignment: avgTugas,
            uts: scoreUTS,
            uas: scoreUAS
          },
          final_score: finalScore,
          final_point: finalPoint,
          predicate: predicate,
          status: passed ? Config.STATUS.PASSED : Config.STATUS.FAILED,
          enrollment_status: e.status
        });
      }
    }

    return Utils.createSuccessResponse({
      profile: {
        user_id: user.user_id,
        full_name: user.full_name,
        current_level: currentLevel || 1, // Default to 1 if no enrollments
        status: user.status
      },
      academics: academicData
    });
  },

  /**
   * Submits attendance for a session.
   */
  submitAttendance: function(params) {
    // Expected params: student_id, course_id, status (default HADIR), date (optional, default today)
    // In real app, date should probably be server time or validated against schedule.
    var studentId = params.student_id;
    var courseId = params.course_id;
    var status = params.status || 'HADIR';
    var date = params.date || new Date();

    return Attendance.submit(studentId, courseId, status, date);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Student;
}
