// src/Seeder.gs

/**
 * ==========================================
 * ALAT BANTU TESTING (DUMMY DATA GENERATOR)
 * ==========================================
 * File ini berisi fungsi-fungsi untuk mengisi data palsu (dummy)
 * dan mengetes koneksi ke Google Drive.
 *
 * CARA PAKAI:
 * 1. Buka file ini di Editor Apps Script.
 * 2. Pilih fungsi 'seedDatabase' untuk isi data dummy.
 * 3. Pilih fungsi 'testDriveUpload' untuk tes upload file.
 * 4. Klik tombol 'Run'.
 */

/**
 * GENERATE DUMMY DATA (10 DATA PER TABEL)
 */
function seedDatabase() {
  Logger.log("Memulai proses seeding data dummy...");

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
      password_hash: "Admin12345"
    };

    // Cek duplikasi sederhana agar tidak error jika dijalankan 2x
    var existing = getData(CONFIG.SHEET_NAMES.USERS).find(function(u) { return u.user_id == userId; });
    if (!existing) {
       insertData(CONFIG.SHEET_NAMES.USERS, user);
    }

    if (role === CONFIG.ROLES.STUDENT) students.push(userId);
    if (role === CONFIG.ROLES.LECTURER) lecturers.push(userId);
  }

  // 2. SEED COURSES (10 Data)
  Logger.log("Seeding Courses...");
  var courses = [];
  var levels = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6];

  for (var i = 1; i <= 10; i++) {
    var courseId = "CRS-" + i;
    var course = {
      course_id: courseId,
      name: "Mata Kuliah Dummy " + i,
      lecturer_id: lecturers[0] || "testing9",
      level: levels[i-1],
      sks: 2,
      semester_period: "2024-GANJIL"
    };

    var existing = getData(CONFIG.SHEET_NAMES.COURSES).find(function(c) { return c.course_id == courseId; });
    if (!existing) insertData(CONFIG.SHEET_NAMES.COURSES, course);
    courses.push(courseId);
  }

  // 3. SEED ENROLLMENTS
  Logger.log("Seeding Enrollments...");
  var enrollments = [];
  for (var i = 0; i < students.length; i++) {
    var studentId = students[i];
    var courseId = courses[i % courses.length];
    var enrollmentId = "ENR-" + (i+1);

    var existing = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).find(function(e) { return e.enrollment_id == enrollmentId; });

    if (!existing) {
      insertData(CONFIG.SHEET_NAMES.ENROLLMENTS, {
        enrollment_id: enrollmentId,
        student_id: studentId,
        course_id: courseId,
        final_grade: 0,
        final_point: 0,
        status: "ENROLLED"
      });
    }
    enrollments.push({ id: enrollmentId, student: studentId, course: courseId });
  }

  // 4. SEED ATTENDANCE
  Logger.log("Seeding Attendance...");
  enrollments.forEach(function(enr, idx) {
    var attId = "ATT-" + (idx+1);
    var existing = getData(CONFIG.SHEET_NAMES.ATTENDANCE).find(function(a) { return a.attendance_id == attId; });

    if (!existing) {
      var statusOpts = ["HADIR", "HADIR", "REKAMAN", "IZIN"];
      var status = statusOpts[idx % statusOpts.length];
      var points = (status === "HADIR") ? 100 : (status === "REKAMAN") ? 80 : (status === "IZIN") ? 50 : 0;

      insertData(CONFIG.SHEET_NAMES.ATTENDANCE, {
        attendance_id: attId,
        course_id: enr.course,
        student_id: enr.student,
        session_date: new Date().toISOString().split('T')[0],
        status: status,
        points: points
      });
    }
  });

  // 5. SEED ASSIGNMENTS
  Logger.log("Seeding Assignments...");
  courses.forEach(function(courseId, idx) {
    var asgId = "ASG-" + (idx+1);
    var existing = getData(CONFIG.SHEET_NAMES.ASSIGNMENTS).find(function(a) { return a.assignment_id == asgId; });

    if (!existing) {
      insertData(CONFIG.SHEET_NAMES.ASSIGNMENTS, {
        assignment_id: asgId,
        course_id: courseId,
        type: "TUGAS",
        max_score: 100
      });
    }
  });

  // 6. SEED SUBMISSIONS
  Logger.log("Seeding Submissions...");
  enrollments.forEach(function(enr, idx) {
    var subId = "SUB-" + (idx+1);
    var existing = getData(CONFIG.SHEET_NAMES.SUBMISSIONS).find(function(s) { return s.submission_id == subId; });

    if (!existing) {
      var courseIndex = courses.indexOf(enr.course);
      var assignId = "ASG-" + (courseIndex + 1);

      insertData(CONFIG.SHEET_NAMES.SUBMISSIONS, {
        submission_id: subId,
        assignment_id: assignId,
        student_id: enr.student,
        score: 80 + (idx * 2)
      });
    }
  });

  // 7. SEED PAYMENTS
  Logger.log("Seeding Payments...");
  students.forEach(function(studentId, idx) {
    var payId = "PAY-" + (idx+1);
    var existing = getData(CONFIG.SHEET_NAMES.PAYMENTS).find(function(p) { return p.payment_id == payId; });

    if (!existing) {
      insertData(CONFIG.SHEET_NAMES.PAYMENTS, {
        payment_id: payId,
        student_id: studentId,
        amount: 500000,
        proof_url: "https://drive.google.com/file/d/dummy_proof_" + idx,
        status: "VERIFIED"
      });
    }
  });

  // 8. SEED CERTIFICATES
  Logger.log("Seeding Certificates...");
  var certId = "CERT-1";
  var existing = getData(CONFIG.SHEET_NAMES.CERTIFICATES).find(function(c) { return c.certificate_id == certId; });

  if (!existing && students.length > 0) {
    insertData(CONFIG.SHEET_NAMES.CERTIFICATES, {
      certificate_id: certId,
      student_id: students[0],
      course_id: enrollments[0].course,
      enrollment_id: enrollments[0].id,
      certificate_number: "DIPLOMA-001",
      issue_date: new Date().toISOString().split('T')[0],
      download_url: "https://drive.google.com/file/d/dummy_cert_1"
    });
  }

  Logger.log("Seeding Selesai. Data dummy telah dibuat.");
}


/**
 * TEST UPLOAD GOOGLE DRIVE
 */
function testDriveUpload() {
  Logger.log("Memulai test upload...");

  var dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  var targetFolderId = CONFIG.DRIVE_FOLDERS.PAYMENT_PROOFS;

  try {
    var url = saveFileToDrive(dummyBase64, "image/png", "test_upload_merah.png", targetFolderId);
    Logger.log("BERHASIL! File terupload.");
    Logger.log("URL File: " + url);
  } catch (e) {
    Logger.log("GAGAL: " + e.toString());
  }
}
