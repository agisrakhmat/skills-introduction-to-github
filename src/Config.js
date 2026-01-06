var Config = {
  // App Info
  APP_NAME: "Diploma Ilmi LMS",
  VERSION: "3.1",

  // Database Configuration
  // HARAP DIGANTI dengan ID Spreadsheet Anda yang sebenarnya
  SPREADSHEET_ID: "18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE",

  // Roles
  ROLE: {
    STUDENT: "STUDENT",
    LECTURER: "LECTURER",
    FINANCE: "FINANCE",
    ACADEMIC: "ACADEMIC",
    ADMIN: "ADMIN",
    STAFF_KESISWAAN: "STAFF_KESISWAAN"
  },

  // User Status
  STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  },

  // Attendance Scores
  ATTENDANCE_SCORE: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  },

  // Grading Weights (Must sum to 1.0)
  GRADING_WEIGHT: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  // Passing Criteria
  PASSING_POINT: 3.0,
  PASSING_SCORE_MIN: 80,

  // Enrollment Status
  ENROLLMENT_STATUS: {
    ENROLLED: "ENROLLED",
    PASSED: "PASSED",
    FAILED: "FAILED"
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Config;
}
