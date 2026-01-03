var Enrollments = {

  /**
   * Gets enrollments for a student.
   * @param {string} studentId
   * @return {Array<Object>}
   */
  getByStudent: function(studentId) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ENROLLMENTS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var enrollments = [];

    // Skip header
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == studentId) {
        enrollments.push({
          enrollment_id: data[i][0],
          student_id: data[i][1],
          course_id: data[i][2],
          final_grade: data[i][3],
          final_point: data[i][4],
          status: data[i][5]
        });
      }
    }
    return enrollments;
  },

  /**
   * Enrolls a student in a course.
   * Enforces Single Level Policy and Sequential Progression.
   * @param {string} studentId
   * @param {string} courseId
   * @return {TextOutput}
   */
  enroll: function(studentId, courseId) {
    // 1. Validate Course
    var course = Courses.getById(courseId);
    if (!course) {
      return Utils.createErrorResponse('Course not found', 404);
    }

    // 2. Check for existing enrollment
    var currentEnrollments = this.getByStudent(studentId);
    for (var i = 0; i < currentEnrollments.length; i++) {
      if (currentEnrollments[i].course_id == courseId) {
        return Utils.createErrorResponse('Already enrolled in this course', 409);
      }
    }

    // 3. Single Level Policy
    // Ensure student is not taking courses from different levels simultaneously (unless finished?)
    // "Mahasiswa hanya boleh mengambil mata kuliah di satu Mustawa pada waktu yang sama."
    var activeLevel = null;
    for (var i = 0; i < currentEnrollments.length; i++) {
      var e = currentEnrollments[i];
      // If currently enrolled (not passed/failed/dropped)
      if (e.status === Config.STATUS.ENROLLED) {
        var c = Courses.getById(e.course_id);
        if (c) {
          if (activeLevel === null) activeLevel = c.level;
          else if (activeLevel !== c.level) {
             // This shouldn't happen if logic is enforced, but if it is, we have a problem.
          }
        }
      }
    }

    if (activeLevel !== null && activeLevel !== course.level) {
      return Utils.createErrorResponse('Single Level Policy Violation: You are currently active in Level ' + activeLevel, 403);
    }

    // 4. Sequential Progression (Mustawa N+1 locked until N passed)
    if (course.level > 1) {
      var prevLevel = course.level - 1;
      var prevCourses = Courses.getByLevel(prevLevel);

      if (prevCourses.length > 0) {
        var passedCount = 0;
        for (var i = 0; i < currentEnrollments.length; i++) {
          var e = currentEnrollments[i];
          var c = Courses.getById(e.course_id);
          if (c && c.level == prevLevel && e.status === Config.STATUS.PASSED) {
            passedCount++;
          }
        }

        if (passedCount < prevCourses.length) {
          return Utils.createErrorResponse('Locked: You must pass all courses in Level ' + prevLevel + ' first.', 403);
        }
      }
    }

    // 5. Proceed to Enroll
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ENROLLMENTS);
    var id = Utils.generateUUID();

    sheet.appendRow([
      id,
      studentId,
      courseId,
      0, // Grade
      0, // Point
      Config.STATUS.ENROLLED
    ]);

    return Utils.createSuccessResponse({ enrollment_id: id }, 'Enrolled successfully');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Enrollments;
}
