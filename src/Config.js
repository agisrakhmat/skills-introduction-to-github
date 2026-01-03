// src/Config.js

/**
 * Configuration constants for the Diploma Ilmi LMS Backend.
 */
var Config = {
  // IDs
  SPREADSHEET_ID: '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE',
  DRIVE_FOLDER_ID: '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4',
  SLIDE_TEMPLATE_ID: '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ',

  // Sheet Names
  SHEET_USER: 'data_user',
  SHEET_CERTIFICATE: 'sertifikat',
  SHEET_COURSES: ['Aqidah', 'Dakwah', "Fiqih Syafi'i", 'Fiqih Waris', 'Nahwu'],

  // Grading Thresholds
  GRADE_THRESHOLDS: [
    { min: 95, predicate: 'Mumtaz' },
    { min: 85, predicate: 'Jayyid Jiddan Murtafi' },
    { min: 80, predicate: 'Jayyid Jiddan' },
    { min: 75, predicate: "Jayyid Murtafi'" },
    { min: 60, predicate: 'Jayyid' }
  ],

  // Graduation Minimum Average
  MIN_PASS_AVERAGE: 60
};

// Export for Node.js testing environment
if (typeof module !== 'undefined') {
  module.exports = Config;
}
