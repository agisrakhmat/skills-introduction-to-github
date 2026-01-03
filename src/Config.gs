var Config = {
  APP_NAME: 'Diploma Ilmi LMS',
  VERSION: '3.1',

  CURRENT_BATCH: '07',
  CURRENT_YEAR: '25', // 2025

  // Database Configuration
  SPREADSHEET_ID: '1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA',

  // Sheet Names
  SHEETS: {
    USERS: 'USERS',
    COURSES: 'COURSES',
    ENROLLMENTS: 'ENROLLMENTS',
    ATTENDANCE: 'ATTENDANCE',
    ASSIGNMENTS: 'ASSIGNMENTS',
    SUBMISSIONS: 'SUBMISSIONS',
    PAYMENTS: 'PAYMENTS',
    CERTIFICATES: 'CERTIFICATES'
  },

  // User Roles
  ROLES: {
    STUDENT: 'STUDENT',
    LECTURER: 'LECTURER',
    FINANCE: 'FINANCE',
    ADMIN: 'ADMIN',
    ACADEMIC: 'ACADEMIC'
  },

  // Status Enums
  STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    ENROLLED: 'ENROLLED'
  },

  // Attendance Types and Scores
  ATTENDANCE_SCORES: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  },

  // Grading Weights
  WEIGHTS: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  // Folder IDs for Google Drive
  FOLDERS: {
    CERTIFICATES: '1XAgam8EcNiaAiKKi4c5aksgTG2y5_OEk',
    ASSIGNMENTS: '1J8tS_z-vxmrRM6H9ajDXGdbDs7kFxYNS',
    PAYMENTS: '1f290UerP4m7hZ4orznTzpD26GLGPM0kg',
    RECEIPTS: '1T5LmOfnHnt4TeFzfFrl8zLKocGeg0s57',
    TRANSCRIPTS: '1dXdoJrVwJ7AXCVzF76-fQkhyo8fL8I7C',
    REGISTRATION: '1fb3tirvtPD-M0HvYI_Rdb0dT7A9eX_yq'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}
