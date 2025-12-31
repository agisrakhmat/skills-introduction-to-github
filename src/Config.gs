/**
 * Config.gs
 * Menyimpan konfigurasi global untuk aplikasi Diploma Ilmi LMS.
 */

var CONFIG = {
  // ID Spreadsheet Utama (Database)
  SPREADSHEET_ID: "1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA",

  // Nama-nama Sheet di Database
  SHEET_NAMES: {
    USERS: "Users",
    COURSES: "Courses",
    ENROLLMENTS: "Enrollments",
    SCHEDULES: "Schedules",
    LESSONS: "Lessons",
    ASSIGNMENTS: "Assignments",
    SUBMISSIONS: "Submissions",
    ATTENDANCE_STUDENT: "Attendance_Student",
    ATTENDANCE_TEACHER: "Attendance_Teacher",
    PAYMENTS: "Payments",
    COSTS: "Costs",
    PAYROLL: "Payroll",
    GRADES: "Grades",
    CERTIFICATE_TEMPLATES: "Certificate_Templates",
    CERTIFICATES_ISSUED: "Certificates_Issued",
    COUNTERS: "Counters",
    PERF_LOGS: "Perf_Logs"
  },

  // Peran User
  ROLES: {
    STUDENT: "STUDENT",
    LECTURER: "LECTURER",
    FINANCE: "FINANCE",
    ADMIN: "ADMIN",
    ACADEMIC: "ACADEMIC"
  },

  // Status User/Enrollment
  STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PASSED: "PASSED",
    FAILED: "FAILED"
  },

  // Standar Kelulusan
  PASSING_GRADE: 3.0,

  // Batch Saat Ini
  CURRENT_BATCH: "07",

  // Bobot Penilaian
  WEIGHTS: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  // Skor Kehadiran
  ATTENDANCE_SCORES: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  },

  // ID Folder Google Drive
  DRIVE_FOLDERS: {
    CERTIFICATES: "1XAgam8EcNiaAiKKi4c5aksgTG2y5_OEk",
    ASSIGNMENTS: "1J8tS_z-vxmrRM6H9ajDXGdbDs7kFxYNS",
    PAYMENT_PROOFS: "1f290UerP4m7hZ4orznTzpD26GLGPM0kg",
    PAYMENT_RECEIPTS: "1T5LmOfnHnt4TeFzfFrl8zLKocGeg0s57",
    TRANSCRIPTS: "1dXdoJrVwJ7AXCVzF76-fQkhyo8fL8I7C",
    REGISTRATION_ATTACHMENTS: "1fb3tirvtPD-M0HvYI_Rdb0dT7A9eX_yq"
  }
};

/**
 * Fungsi helper untuk mengekspos CONFIG jika dibutuhkan di sisi client (jarang dipakai langsung, tapi bagus untuk debug)
 */
function getConfig() {
  return CONFIG;
}

// Export module for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
