var CourseService = {
  /**
   * Enrolls a student in a course.
   * Enforces Mustawa logic:
   * 1. Single Level Policy: Cannot take courses from different levels simultaneously.
   * 2. Sequential Progression: Must pass all courses in level N before taking N+1.
   */
  enroll: function(studentId, courseId) {
    const courses = Database.getTable(SHEET_NAMES.COURSES);
    const targetCourse = courses.find(c => c.course_id === courseId);
    if (!targetCourse) return { success: false, message: 'Mata kuliah tidak ditemukan.' };

    const targetLevel = parseInt(targetCourse.level);

    // Get current enrollments for student
    const enrollments = Database.getTable(SHEET_NAMES.ENROLLMENTS).filter(e => e.student_id === studentId);

    // Check Single Level Policy
    // Find active enrollments (status ENROLLED)
    const activeEnrollments = enrollments.filter(e => e.status === 'ENROLLED');

    for (var i = 0; i < activeEnrollments.length; i++) {
      const enrolledCourse = courses.find(c => c.course_id === activeEnrollments[i].course_id);
      if (enrolledCourse && parseInt(enrolledCourse.level) !== targetLevel) {
        return {
          success: false,
          message: 'Kebijakan Single Level: Anda sedang mengambil mata kuliah di Mustawa ' + enrolledCourse.level + '. Selesaikan dulu sebelum mengambil Mustawa ' + targetLevel + '.'
        };
      }
    }

    // Check Sequential Progression
    if (targetLevel > 1) {
      const prevLevel = targetLevel - 1;
      // Get all courses in prevLevel
      const prevLevelCourses = courses.filter(c => parseInt(c.level) === prevLevel);

      // Check if student has PASSED all of them
      const passedCourseIds = enrollments
        .filter(e => e.status === 'PASSED' && (parseFloat(e.final_point) >= 3.0)) // Double check point requirement
        .map(e => e.course_id);

      const missingCourses = prevLevelCourses.filter(c => !passedCourseIds.includes(c.course_id));

      if (missingCourses.length > 0) {
        return {
          success: false,
          message: 'Anda belum lulus semua mata kuliah di Mustawa ' + prevLevel + '. Silakan selesaikan terlebih dahulu.'
        };
      }
    }

    // Check if already enrolled or passed
    const existing = enrollments.find(e => e.course_id === courseId);
    if (existing && (existing.status === 'ENROLLED' || existing.status === 'PASSED')) {
        return { success: false, message: 'Anda sudah terdaftar atau lulus mata kuliah ini.' };
    }

    // Proceed to Enroll
    const newEnrollment = {
      enrollment_id: 'E' + new Date().getTime(),
      student_id: studentId,
      course_id: courseId,
      final_grade: '',
      final_point: '',
      status: 'ENROLLED'
    };

    Database.insert(SHEET_NAMES.ENROLLMENTS, newEnrollment);
    return { success: true, message: 'Berhasil mendaftar mata kuliah.', data: newEnrollment };
  }
};

if (typeof module !== 'undefined') {
  module.exports = { CourseService };
}
