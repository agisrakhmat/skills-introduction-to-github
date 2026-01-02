/**
 * DatabaseSetup.gs
 * Script untuk menginisialisasi struktur database (Sheet Headers) dan mengisi Data Dummy.
 * Jalankan fungsi `initializeDatabase()` sekali saat pertama kali setup.
 * Jalankan fungsi `seedDummyData()` untuk mengisi data simulasi.
 */

// Memuat konfigurasi jika dijalankan di lingkungan Node.js lokal
if (typeof require !== 'undefined') {
  var CONFIG = require('./Config.gs');
}

/**
 * Membuat Sheet dan Header jika belum ada.
 */
function createSheetHeaders() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  var headers = {
    [CONFIG.SHEET_NAMES.USERS]: ["User_ID", "NIM", "Email", "Password_Hash", "Full_Name", "TTL", "Gender", "Address", "Phone", "Old_NIM", "Status_S1", "Role", "Status", "Batch", "Bank_Account", "Created_By", "Created_At"],
    [CONFIG.SHEET_NAMES.COURSES]: ["Course_ID", "Course_Name", "Course_Code", "Description", "Credits", "Academic_Period", "Created_At"],
    [CONFIG.SHEET_NAMES.ENROLLMENTS]: ["Enrollment_ID", "User_ID", "Course_ID", "Academic_Period", "Status", "Enrollment_Date", "Final_Grade", "Final_Point", "Created_At"],
    [CONFIG.SHEET_NAMES.SCHEDULES]: ["Schedule_ID", "Course_ID", "Day", "Time_Start", "Time_End", "Lecturer", "Room", "Academic_Period"],
    [CONFIG.SHEET_NAMES.LESSONS]: ["Lesson_ID", "Course_ID", "Lesson_Title", "Lesson_Number", "Content_URL", "Created_At"],
    [CONFIG.SHEET_NAMES.ASSIGNMENTS]: ["Assignment_ID", "Course_ID", "Teacher_ID", "Title", "Type", "Instructions", "Due_Date", "Category", "Weight", "Created_At"],
    [CONFIG.SHEET_NAMES.SUBMISSIONS]: ["Submission_ID", "Assignment_ID", "User_ID", "File_Tugas_URL", "Text_Answer", "Student_Note", "Score", "Feedback", "Timestamp"],
    [CONFIG.SHEET_NAMES.ATTENDANCE_STUDENT]: ["Attendance_ID", "User_ID", "Course_ID", "Week", "Date", "Status", "Score", "Notes", "Timestamp"],
    [CONFIG.SHEET_NAMES.ATTENDANCE_TEACHER]: ["Attendance_ID", "Schedule_ID", "Teacher_ID", "Status", "Attended_At"],
    [CONFIG.SHEET_NAMES.PAYMENTS]: ["Payment_ID", "User_ID", "Type", "Period", "Amount", "Proof_URL", "Description", "Status", "Verified_By", "Created_At"],
    [CONFIG.SHEET_NAMES.COSTS]: ["Cost_ID", "Category", "Description", "Amount", "Date", "Approved_By", "Status"],
    [CONFIG.SHEET_NAMES.PAYROLL]: ["Payroll_ID", "Teacher_ID", "Month", "Year", "Base_Salary", "Allowance", "Deduction", "Status", "Created_At"],
    [CONFIG.SHEET_NAMES.GRADES]: ["Grade_ID", "Enrollment_ID", "UTS", "UAS", "Final_Grade", "Letter_Grade", "Grade_Point", "IPK_Contribution", "Created_At", "Updated_At"],
    [CONFIG.SHEET_NAMES.CERTIFICATE_TEMPLATES]: ["Template_ID", "Name", "Doc_Type", "Mustawa_Course", "File_ID", "File_Type", "Active", "Updated_By", "Updated_At"],
    [CONFIG.SHEET_NAMES.CERTIFICATES_ISSUED]: ["Certificate_No", "User_ID", "Student_Name", "Mustawa_Course", "IPK", "Predicate", "Status", "Download_URL", "Issued_At", "Template_ID", "Created_By"],
    [CONFIG.SHEET_NAMES.COUNTERS]: ["Scope", "Last_Number", "Updated_At"],
    [CONFIG.SHEET_NAMES.PERF_LOGS]: ["Action", "Duration_ms", "Timestamp", "Meta"]
  };

  for (var sheetName in headers) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers[sheetName]);
      sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight("bold");
    } else {
      // Cek apakah header sudah ada, jika kosong, isi header
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers[sheetName]);
        sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight("bold");
      }
    }
  }
}

/**
 * Data Mata Kuliah Referensi
 */
var COURSES_DATA = [
  // Mustawa 1 (A7)
  {
    name: "Fiqh Mawaris",
    level: "Mustawa 1",
    code: "M1-FM",
    schedules: [{day: "Selasa", start: "20.00", end: "21.30", lecturer: "Ustadz Saiful Awal, Lc"}]
  },
  {
    name: "Fiqh Syafi'i (Ikhwan)",
    level: "Mustawa 1",
    code: "M1-FSI",
    schedules: [{day: "Rabu", start: "18.20", end: "19.50", lecturer: "Ustadz Muhammad Taufik, Lc"}]
  },
  {
    name: "Fiqh Syafi'i (Akhwat)",
    level: "Mustawa 1",
    code: "M1-FSA",
    schedules: [{day: "Jum'at", start: "20.00", end: "21.30", lecturer: "Ustadzah Laila Al-Ghifariyah, B.A"}]
  },
  {
    name: "Aqidah",
    level: "Mustawa 1",
    code: "M1-AQ",
    schedules: [{day: "Kamis", start: "20.00", end: "21.30", lecturer: "Ustadz Jundi Qoriba, M.A"}]
  },
  {
    name: "Dakwah",
    level: "Mustawa 1",
    code: "M1-DW",
    schedules: [{day: "Senin", start: "20.00", end: "21.30", lecturer: "Ustadz Hengki Dian Putra, B.A"}]
  },
  {
    name: "Nahwu",
    level: "Mustawa 1",
    code: "M1-NH",
    schedules: [{day: "Selasa", start: "05.00", end: "06.30", lecturer: "Ustadz Andi Setio Ahmad, B.A"}]
  },
  // Mustawa 2 (A6)
  {
    name: "Fiqh Mawaris",
    level: "Mustawa 2",
    code: "M2-FM",
    schedules: [{day: "Senin", start: "20.00", end: "21.30", lecturer: "Ustadz Saiful Awal, Lc"}]
  },
  {
    name: "Fiqh Syafi'i",
    level: "Mustawa 2",
    code: "M2-FS",
    schedules: [{day: "Senin", start: "18.20", end: "19.50", lecturer: "Ustadz Muhammad Taufik, Lc"}]
  },
  {
    name: "Aqidah",
    level: "Mustawa 2",
    code: "M2-AQ",
    schedules: [{day: "Selasa", start: "20.00", end: "21.30", lecturer: "Ustadz Jundi Qoriba, M.A"}]
  },
  {
    name: "Hadits",
    level: "Mustawa 2",
    code: "M2-HD",
    schedules: [{day: "Kamis", start: "18.20", end: "19.50", lecturer: "Ustadz Muhammad Taufik, Lc"}]
  },
  {
    name: "Nahwu",
    level: "Mustawa 2",
    code: "M2-NH",
    schedules: [{day: "Rabu", start: "05.00", end: "06.30", lecturer: "Ustadz Andi Setio Ahmad, B.A"}]
  }
];

/**
 * Mengisi Data Dummy
 * 10 Mahasiswa, Enrollment, Nilai, dll.
 */
function seedDummyData() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 1. Seed Courses, Schedules & Lessons
  var courseSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.COURSES);
  var scheduleSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SCHEDULES);
  var lessonSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LESSONS);
  var attendanceTeacherSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ATTENDANCE_TEACHER);

  var coursesMap = {}; // Map Course Name -> Course ID
  var scheduleIds = []; // Simpan schedule ID untuk absensi dosen

  COURSES_DATA.forEach(function(c, index) {
    var cId = "C-" + (index + 1).toString().padStart(3, '0');
    coursesMap[c.name] = cId;

    // Simpan Course
    courseSheet.appendRow([
      cId, c.name, c.code, "Deskripsi mata kuliah " + c.name, 2, "2025-1", new Date()
    ]);

    // Simpan Schedule
    c.schedules.forEach(function(s, sIdx) {
      var schId = "SCH-" + cId + "-" + sIdx;
      scheduleIds.push({id: schId, lecturer: s.lecturer});
      scheduleSheet.appendRow([
        schId,
        cId,
        s.day,
        s.start,
        s.end,
        s.lecturer,
        "Online Zoom",
        "2025-1"
      ]);
    });

    // Simpan Lessons (2 pertemuan dummy)
    for (var l = 1; l <= 2; l++) {
      lessonSheet.appendRow([
        "LSN-" + cId + "-" + l,
        cId,
        "Materi Pertemuan " + l + " - " + c.name,
        l,
        "https://drive.google.com/file/d/dummy-lesson-file",
        new Date()
      ]);
    }
  });

  // 1b. Seed Attendance Teacher
  scheduleIds.forEach(function(sch) {
    for (var w = 1; w <= 12; w++) {
      attendanceTeacherSheet.appendRow([
        "ATT-T-" + sch.id + "-" + w,
        sch.id,
        sch.lecturer, // Pakai Nama Dosen sebagai ID sementara
        "HADIR",
        new Date()
      ]);
    }
  });

  // 2. Seed Users (10 Mahasiswa)
  var userSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
  var paymentSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PAYMENTS);
  var students = [];

  for (var i = 1; i <= 10; i++) {
    var gender = i % 2 === 0 ? "Wanita" : "Pria"; // Genap Wanita, Ganjil Pria
    var genderCode = gender === "Pria" ? "IN" : "AT";
    var nim = "DI." + genderCode + ".25.07.RGR." + i.toString().padStart(4, '0');
    var userId = "U-" + i.toString().padStart(4, '0');
    var name = gender === "Pria" ? "Mahasiswa Pria " + i : "Mahasiswa Wanita " + i;

    var student = {
      userId: userId,
      nim: nim,
      name: name,
      gender: gender,
      email: "student" + i + "@diplomailmi.com"
    };
    students.push(student);

    userSheet.appendRow([
      userId,
      nim,
      student.email,
      "HASH1234", // Password dummy
      name,
      "Jakarta, 01-01-2000",
      gender,
      "Jl. Dummy No. " + i,
      "62812345678" + i,
      "-",
      "Tidak",
      CONFIG.ROLES.STUDENT,
      CONFIG.STATUS.ACTIVE,
      CONFIG.CURRENT_BATCH,
      "BCA 123456" + i,
      "SYSTEM",
      new Date()
    ]);

    // Simpan Payment (SPP)
    paymentSheet.appendRow([
      "PAY-" + userId + "-01",
      userId,
      "SPP",
      "Bulan 1",
      300000,
      "https://drive.google.com/file/d/dummy-proof",
      "Pembayaran SPP Bulan 1",
      "VERIFIED", // Langsung verified untuk dummy
      "ADMIN-FINANCE",
      new Date()
    ]);
  }

  // 2b. Seed STAFF Users (Admin, Finance, Lecturer) - PENTING UNTUK TEST LOGIN STAFF
  var staffData = [
    { id: "ADM-001", email: "admin@diplomailmi.com", role: CONFIG.ROLES.ADMIN, name: "Super Admin" },
    { id: "FIN-001", email: "finance@diplomailmi.com", role: CONFIG.ROLES.FINANCE, name: "Staff Keuangan" },
    { id: "LEC-001", email: "lecturer@diplomailmi.com", role: CONFIG.ROLES.LECTURER, name: "Ustadz Saiful Awal, Lc" }
  ];

  staffData.forEach(function(staff) {
    userSheet.appendRow([
      staff.id,
      staff.id, // NIM/NIP sama dengan ID untuk staff
      staff.email,
      "HASH1234", // Password dummy
      staff.name,
      "Jakarta, 01-01-1980",
      "Pria",
      "Jl. Staff Kampus",
      "62899999999",
      "-",
      "-",
      staff.role,
      CONFIG.STATUS.ACTIVE,
      "-",
      "BSI 1234",
      "SYSTEM",
      new Date()
    ]);
  });

  // 3. Seed Enrollments, Attendance, Assignments, Grades
  var enrollmentSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var attendanceSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ATTENDANCE_STUDENT);
  var assignmentSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ASSIGNMENTS);
  var submissionSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
  var gradeSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GRADES);

  var assignmentMap = {}; // CourseID -> [AssignmentID]

  // Buat Assignment Dummy dulu untuk setiap Course
  for (var cName in coursesMap) {
    var cId = coursesMap[cName];
    assignmentMap[cId] = [];
    // Buat 2 tugas per course
    for (var a = 1; a <= 2; a++) {
      var aId = "ASN-" + cId + "-" + a;
      assignmentMap[cId].push(aId);
      assignmentSheet.appendRow([
        aId, cId, "TEACHER-1", "Tugas " + a + " " + cName, "Online", "Kerjakan dengan baik",
        new Date(), "Tugas", 100, new Date()
      ]);
    }
  }

  // Loop setiap mahasiswa untuk Enroll ke mata kuliah Mustawa 1
  students.forEach(function(std, stdIdx) {
    // Filter mata kuliah berdasarkan gender jika perlu (Fiqh Syafi'i)
    var studentCourses = COURSES_DATA.filter(function(c) {
      if (c.level !== "Mustawa 1") return false;
      if (c.name.includes("(Ikhwan)") && std.gender !== "Pria") return false;
      if (c.name.includes("(Akhwat)") && std.gender !== "Wanita") return false;
      return true;
    });

    studentCourses.forEach(function(c) {
      var cId = coursesMap[c.name];
      var enrollId = "ENR-" + std.userId + "-" + cId;

      // Hitung simulasi nilai
      // Attendance: 12 pertemuan, asumsi hadir semua (100) atau bolong dikit
      var totalAttendanceScore = 0;
      for (var w = 1; w <= 12; w++) {
        // Randomize attendance: 90% Hadir, 10% Izin/Sakit
        var status = Math.random() > 0.1 ? "HADIR" : "IZIN";
        var score = CONFIG.ATTENDANCE_SCORES[status];
        totalAttendanceScore += score;

        attendanceSheet.appendRow([
          "ATT-" + std.userId + "-" + cId + "-" + w,
          std.userId,
          cId,
          w,
          new Date(), // Tanggal dummy
          status,
          score,
          "Catatan kehadiran",
          new Date()
        ]);
      }
      var avgAttendance = totalAttendanceScore / 12;

      // Assignments
      var totalAssignmentScore = 0;
      assignmentMap[cId].forEach(function(aId) {
        var score = 80 + Math.floor(Math.random() * 20); // Nilai 80-100
        totalAssignmentScore += score;

        submissionSheet.appendRow([
          "SUB-" + aId + "-" + std.userId,
          aId,
          std.userId,
          "http://drive.google.com/dummyfile",
          "Jawaban tugas",
          "",
          score,
          "Good job",
          new Date()
        ]);
      });
      var avgAssignment = totalAssignmentScore / 2;

      // UTS & UAS
      var scoreUTS = 75 + Math.floor(Math.random() * 25); // 75-100
      var scoreUAS = 70 + Math.floor(Math.random() * 30); // 70-100

      // Hitung Final Grade
      // Formula: (Attendance * 20%) + (Assignment * 15%) + (UTS * 30%) + (UAS * 35%)
      var finalScore = (avgAttendance * CONFIG.WEIGHTS.ATTENDANCE) +
                       (avgAssignment * CONFIG.WEIGHTS.ASSIGNMENT) +
                       (scoreUTS * CONFIG.WEIGHTS.UTS) +
                       (scoreUAS * CONFIG.WEIGHTS.UAS);

      var finalPoint = finalScore >= 80 ? 4.0 : (finalScore >= 70 ? 3.0 : 2.0); // Simplifikasi point
      var gradeLetter = finalScore >= 80 ? "A" : (finalScore >= 70 ? "B" : "C");

      enrollmentSheet.appendRow([
        enrollId,
        std.userId,
        cId,
        "2025-1",
        CONFIG.STATUS.PASSED, // Asumsi lulus semua untuk dummy
        new Date(),
        finalScore.toFixed(2),
        finalPoint,
        new Date()
      ]);

      gradeSheet.appendRow([
        "GRD-" + enrollId,
        enrollId,
        scoreUTS,
        scoreUAS,
        finalScore.toFixed(2),
        gradeLetter,
        finalPoint,
        finalPoint * 2, // SKS = 2 asumsi
        new Date(),
        new Date()
      ]);
    });
  });

  // 4. Seed Remaining Tables (Costs, Payroll, Certificates, etc.)
  var costSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.COSTS);
  costSheet.appendRow(["COST-001", "IT", "Biaya Server Tahunan", 1500000, new Date(), "ADMIN-KEUANGAN", "APPROVED"]);
  costSheet.appendRow(["COST-002", "Software", "Langganan Zoom Pro", 300000, new Date(), "ADMIN-KEUANGAN", "APPROVED"]);

  var payrollSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PAYROLL);
  // Dummy payroll untuk setiap dosen di jadwal
  var uniqueLecturers = [...new Set(COURSES_DATA.flatMap(c => c.schedules.map(s => s.lecturer)))];
  uniqueLecturers.forEach(function(lec, idx) {
    payrollSheet.appendRow([
      "PAYROLL-" + idx,
      lec,
      "Januari",
      "2025",
      2000000,
      500000,
      0,
      "PAID",
      new Date()
    ]);
  });

  var certTemplateSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CERTIFICATE_TEMPLATES);
  certTemplateSheet.appendRow([
    "TMPL-001", "Sertifikat Kelulusan Mustawa 1", "Certificate", "Mustawa 1",
    "1XAgam8EcNiaAiKKi4c5aksgTG2y5_OEk", "Google Slides", true, "ADMIN", new Date()
  ]);

  var certIssuedSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CERTIFICATES_ISSUED);
  // Issue 1 certificate untuk student pertama
  var s1 = students[0];
  certIssuedSheet.appendRow([
    "CERT-001/DI/2025", s1.userId, s1.name, "Mustawa 1", 3.85, "Mumtaz", "ISSUED",
    "https://drive.google.com/file/d/dummy-cert", new Date(), "TMPL-001", "SYSTEM"
  ]);

  var countersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.COUNTERS);
  countersSheet.appendRow(["NIM_SEQUENCE", 10, new Date()]);
  countersSheet.appendRow(["PAYMENT_ID", 10, new Date()]);

  var perfLogsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERF_LOGS);
  perfLogsSheet.appendRow(["seedDummyData", 1500, new Date(), "Initial Seeding"]);
}

// Export module for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSheetHeaders: createSheetHeaders,
    seedDummyData: seedDummyData,
    COURSES_DATA: COURSES_DATA
  };
}
