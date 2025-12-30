/**
 * Seeder.gs
 * Utility to seed the database with initial data for testing.
 */

var Seeder = {
  run: function() {
    // 1. Create Users
    var users = [
      { user_id: 'DI.IN.24.01.RGR.0001', email: 'student1@example.com', full_name: 'Ahmad Fulan', phone: '6281234567890', role: 'STUDENT', status: 'ACTIVE', password_hash: AuthController._hashPassword('7890') },
      { user_id: 'DI.AT.24.01.RGR.0002', email: 'student2@example.com', full_name: 'Fulanah', phone: '6281234567891', role: 'STUDENT', status: 'ACTIVE', password_hash: AuthController._hashPassword('7891') },
      { user_id: 'LEC.001', email: 'dosen1@example.com', full_name: 'Ustadz Budi', phone: '628111111111', role: 'LECTURER', status: 'ACTIVE', password_hash: AuthController._hashPassword('1111') },
    ];

    users.forEach(function(u) {
      if (!findRow(TABLES.USERS, 'user_id', u.user_id)) {
        appendRow(TABLES.USERS, u);
      }
    });

    // 2. Create Courses
    var courses = [
      { course_id: 'MK.L1.01', name: 'Aqidah Dasar', lecturer_id: 'LEC.001', level: 1, sks: 2, semester_period: '2024-GANJIL' },
      { course_id: 'MK.L1.02', name: 'Fiqh Ibadah', lecturer_id: 'LEC.001', level: 1, sks: 2, semester_period: '2024-GANJIL' },
      { course_id: 'MK.L2.01', name: 'Aqidah Lanjut', lecturer_id: 'LEC.001', level: 2, sks: 2, semester_period: '2024-GENAP' },
    ];

    courses.forEach(function(c) {
      if (!findRow(TABLES.COURSES, 'course_id', c.course_id)) {
        appendRow(TABLES.COURSES, c);
      }
    });

    // 3. Create Enrollments
    var enrollments = [
      { enrollment_id: 'ENR.001', student_id: 'DI.IN.24.01.RGR.0001', course_id: 'MK.L1.01', final_grade: 0, final_point: 0, status: 'ENROLLED' },
      { enrollment_id: 'ENR.002', student_id: 'DI.IN.24.01.RGR.0001', course_id: 'MK.L1.02', final_grade: 0, final_point: 0, status: 'ENROLLED' }
    ];

    enrollments.forEach(function(e) {
      if (!findRow(TABLES.ENROLLMENTS, 'enrollment_id', e.enrollment_id)) {
        appendRow(TABLES.ENROLLMENTS, e);
      }
    });

    return "Seeding Complete";
  }
};
