/**
 * TEMPLATE CONFIGURATION FILE
 * Rename this file to 'Config.gs' in your Google Apps Script project.
 */
var Config = {
  // --- IDs (MUST CHANGE) ---
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE',
  SLIDE_TEMPLATE_ID: 'YOUR_SLIDE_TEMPLATE_ID_HERE',

  // --- Sheet Names (CHANGE IF NEEDED) ---
  SHEET_USER: 'data_user',
  SHEET_CERTIFICATE: 'sertifikat',
  SHEET_COURSES: ['Course_Name_1', 'Course_Name_2', 'Course_Name_3'],

  // --- Column Indexes (0-based) ---
  // Adjust these if your spreadsheet columns are different.
  // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8...
  COL_INDEX_NIM: 0,        // Column A
  COL_INDEX_NAME: 1,       // Column B
  COL_INDEX_SEX: 2,        // Column C
  COL_INDEX_ADDRESS: 3,    // Column D
  COL_INDEX_PROGRAM: 4,    // Column E
  COL_INDEX_PHONE: 5,      // Column F
  COL_INDEX_BATCH: 6,      // Column G (Angkatan)
  COL_INDEX_BIRTHPLACE: 7, // Column H
  COL_INDEX_BIRTHDATE: 8,  // Column I

  // --- Course Grade Sheet Configuration ---
  // Assuming all course sheets share the same structure
  COL_INDEX_GRADE_NIM: 0,   // Column A (NIM)
  COL_INDEX_GRADE_FINAL: 10, // Column K (Final Grade)

  // --- Certificate Number Configuration ---
  // Format: [PREFIX][STATIC_CODE]-[SEQUENCE]
  // Example: Diplim-MSTW-01-07-0001
  CERT_PREFIX: 'YOUR_PREFIX_HERE-', // e.g., 'Diplim-MSTW-01-'
  CERT_STATIC_CODE: '01',           // e.g., '07' or Batch Code

  // --- Grading Standards ---
  // >= 95 Mumtaz, >= 85 Jayyid Jiddan Murtafi, etc.
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
