// src/Seeder.gs

/**
 * GENERATE DUMMY DATA
 * Jalankan fungsi ini SEKALI saja untuk mengisi database dengan data testing.
 */
function seedDatabase() {
  var timestamp = new Date().toISOString();

  // 1. SEED USERS (10 Data)
  // testing1 - testing8: STUDENT
  // testing9: LECTURER
  // testing10: ADMIN
  // Password: Admin12345
  Logger.log("Seeding Users...");
  var students = [];
  var lecturers = [];

  for (var i = 1; i <= 10; i++) {
    var role = CONFIG.ROLES.STUDENT;
    if (i == 9) role = CONFIG.ROLES.LECTURER;
    if (i == 10) role = CONFIG.ROLES.ADMIN;

    var userId = "testing" + i;
    var user = {
      user_id: userId,
      email: userId + "@example.com",
      full_name: "User Testing " + i,
      phone: "0812345678" + (i < 10 ? "0"+i : i),
      role: role,
      status: CONFIG.STATUS.ACTIVE,
      password_hash: "Admin12345" // Sesuai request
    };

    insertData(CONFIG.SHEET_NAMES.USERS, user);
    if (role === CONFIG.ROLES.STUDENT) students.push(userId);
    if (role === CONFIG.ROLES.LECTURER) lecturers.push(userId);
  }

  // 2. SEED COURSES (10 Data)
  Logger.log("Seeding Courses...");
  var courses = [];
  var levels = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6]; // Distribusi level

  for (var i = 1; i <= 10; i++) {
    var courseId = "CRS-" + i;
    var course = {
      course_id: courseId,
      name: "Mata Kuliah Dummy " + i,
      lecturer_id: lecturers[0] || "testing9", // Assign ke dosen dummy
      level: levels[i-1],
      sks: 2,
      semester_period: "2024-GANJIL"
    };

    insertData(CONFIG.SHEET_NAMES.COURSES, course);
    courses.push(courseId);
  }

  // 3. SEED ENROLLMENTS (10 Data - Each Student takes 1 course)
  Logger.log("Seeding Enrollments...");
  var enrollments = [];

  // Student 1-8 ambil course 1 (Level 1) atau course 4 (Level 2)
  for (var i = 0; i < students.length; i++) {
    var studentId = students[i];
    var courseId = courses[i % courses.length]; // Distribusi course

    var enrollmentId = "ENR-" + (i+1);
    var enrollment = {
      enrollment_id: enrollmentId,
      student_id: studentId,
      course_id: courseId,
      final_grade: 0,
      final_point: 0,
      status: "ENROLLED"
    };

    insertData(CONFIG.SHEET_NAMES.ENROLLMENTS, enrollment);
    enrollments.push({ id: enrollmentId, student: studentId, course: courseId });
  }

  // 4. SEED ATTENDANCE (10 Data)
  Logger.log("Seeding Attendance...");
  enrollments.forEach(function(enr, idx) {
    var statusOpts = ["HADIR", "HADIR", "REKAMAN", "IZIN"]; // Bobot acak
    var status = statusOpts[idx % statusOpts.length];
    var points = 0;
    if (status === "HADIR") points = 100;
    if (status === "REKAMAN") points = 80;
    if (status === "IZIN") points = 50;

    insertData(CONFIG.SHEET_NAMES.ATTENDANCE, {
      attendance_id: "ATT-" + (idx+1),
      course_id: enr.course,
      student_id: enr.student,
      session_date: new Date().toISOString().split('T')[0],
      status: status,
      points: points
    });
  });

  // 5. SEED ASSIGNMENTS (10 Data - 1 per Course)
  Logger.log("Seeding Assignments...");
  courses.forEach(function(courseId, idx) {
    insertData(CONFIG.SHEET_NAMES.ASSIGNMENTS, {
      assignment_id: "ASG-" + (idx+1),
      course_id: courseId,
      type: "TUGAS",
      max_score: 100
    });
  });

  // 6. SEED SUBMISSIONS (10 Data)
  Logger.log("Seeding Submissions...");
  enrollments.forEach(function(enr, idx) {
    // Cari assignment untuk course ini (simplifikasi: ASG-idx+1 mungkin beda mapping, kita cari manual/random)
    // Asumsi ASG ID match Course Index for simplicity in loop
    // Course index di enrollments: i % courses.length.
    // Assignment ID utk course X adalah ASG-(indexof(X)+1)

    var courseIndex = courses.indexOf(enr.course);
    var assignId = "ASG-" + (courseIndex + 1);

    insertData(CONFIG.SHEET_NAMES.SUBMISSIONS, {
      submission_id: "SUB-" + (idx+1),
      assignment_id: assignId,
      student_id: enr.student,
      score: 80 + (idx * 2) // Skor variasi 80, 82, ...
    });
  });

  // 7. SEED PAYMENTS (10 Data)
  Logger.log("Seeding Payments...");
  students.forEach(function(studentId, idx) {
    insertData(CONFIG.SHEET_NAMES.PAYMENTS, {
      payment_id: "PAY-" + (idx+1),
      student_id: studentId,
      amount: 500000,
      proof_url: "https://drive.google.com/file/d/dummy_proof_" + idx,
      status: "VERIFIED"
    });
  });

  // 8. SEED CERTIFICATES (Simulink 1-2 data for passed students)
  Logger.log("Seeding Certificates...");
  // Anggap student 1 lulus course 1
  insertData(CONFIG.SHEET_NAMES.CERTIFICATES, {
    certificate_id: "CERT-1",
    student_id: students[0],
    course_id: enrollments[0].course,
    enrollment_id: enrollments[0].id,
    certificate_number: "DIPLOMA-001",
    issue_date: new Date().toISOString().split('T')[0],
    download_url: "https://drive.google.com/file/d/dummy_cert_1"
  });

  Logger.log("Seeding Complete. 10+ records created across tables.");
}
