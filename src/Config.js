// src/Config.js

var Config = {
  // Production Spreadsheet ID from memory
  SPREADSHEET_ID: '1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA',

  // Sheet Names
  SHEET_USERS: 'USERS',
  SHEET_COURSES: 'COURSES',
  SHEET_ENROLLMENTS: 'ENROLLMENTS',
  SHEET_ATTENDANCE: 'ATTENDANCE',
  SHEET_ASSIGNMENTS: 'ASSIGNMENTS',
  SHEET_SUBMISSIONS: 'SUBMISSIONS',
  SHEET_PAYMENTS: 'PAYMENTS',

  // Folders (from memory)
  FOLDER_CERTIFICATES: '1XAgam8EcNiaAiKKi4c5aksgTG2y5_OEk',
  FOLDER_ASSIGNMENTS: '1J8tS_z-vxmrRM6H9ajDXGdbDs7kFxYNS',
  FOLDER_PAYMENTS: '1f290UerP4m7hZ4orznTzpD26GLGPM0kg',
  FOLDER_RECEIPTS: '1T5LmOfnHnt4TeFzfFrl8zLKocGeg0s57',
  FOLDER_TRANSCRIPTS: '1dXdoJrVwJ7AXCVzF76-fQkhyo8fL8I7C',
  FOLDER_REGISTRATION: '1fb3tirvtPD-M0HvYI_Rdb0dT7A9eX_yq',

  // App Constants
  APP_NAME: 'Diploma Ilmi LMS',
  VERSION: '3.1',
  PASSING_POINT: 3.0,

  // Roles
  ROLE_STUDENT: 'STUDENT',
  ROLE_LECTURER: 'LECTURER',
  ROLE_FINANCE: 'FINANCE',
  ROLE_ADMIN: 'ADMIN',
  ROLE_ACADEMIC: 'ACADEMIC',
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Config;
}
