// src/Config.gs

/**
 * Configuration for Diploma Ilmi LMS
 */

var CONFIG = {
  // Replace this with the ID of your Google Sheet
  // Open your Google Sheet -> Copy the ID from the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
  SPREADSHEET_ID: "REPLACE_WITH_YOUR_SPREADSHEET_ID",

  SHEET_NAMES: {
    USERS: "USERS",
    COURSES: "COURSES",
    ENROLLMENTS: "ENROLLMENTS",
    ATTENDANCE: "ATTENDANCE",
    ASSIGNMENTS: "ASSIGNMENTS",
    SUBMISSIONS: "SUBMISSIONS",
    PAYMENTS: "PAYMENTS"
  },

  ROLES: {
    STUDENT: "STUDENT",
    LECTURER: "LECTURER",
    FINANCE: "FINANCE",
    ADMIN: "ADMIN",
    ACADEMIC: "ACADEMIC"
  },

  STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  },

  PASSING_GRADE: 3.0,

  WEIGHTS: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  ATTENDANCE_SCORES: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  }
};
