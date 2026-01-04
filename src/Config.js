/**
 * Configuration constants for the Diploma Ilmi LMS Backend.
 */
var Config = {
  // IDs provided by the user
  SPREADSHEET_ID: '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE',
  DRIVE_FOLDER_ID: '1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4',
  SLIDE_TEMPLATE_ID: '1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ',

  // Sheet Names
  SHEET_USER: 'data_user',
  SHEET_CERTIFICATE: 'sertifikat',
  SHEET_COURSES: ['Aqidah', 'Dakwah', "Fiqih Syafi'i", 'Fiqih Waris', 'Nahwu'],

  // Column Indexes (0-based)
  // Data User Sheet
  COL_INDEX_NIM: 0,        // Column A
  COL_INDEX_NAME: 1,       // Column B
  COL_INDEX_SEX: 2,        // Column C
  COL_INDEX_ADDRESS: 3,    // Column D
  COL_INDEX_PROGRAM: 4,    // Column E
  COL_INDEX_PHONE: 5,      // Column F
  COL_INDEX_BATCH: 6,      // Column G (Angkatan)
  COL_INDEX_BIRTHPLACE: 7, // Column H
  COL_INDEX_BIRTHDATE: 8,  // Column I

  // Course Sheets
  COL_INDEX_GRADE_NIM: 0,  // Column A
  COL_INDEX_GRADE_FINAL: 10, // Column K

  // Certificate Configuration
  CERT_PREFIX: 'Diplim-MSTW-01-',
  CERT_STATIC_CODE: '07', // Used as part of the number: Prefix + StaticCode + Sequence

  // Grading Thresholds (Predikat)
  // >= 95 Mumtaz, >= 85 Jayyid Jiddan Murtafi, >= 80 Jayyid Jiddan, >= 75 Jayyid Murtafi', >= 60 Jayyid
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
