// Import dependencies if running in Node.js
if (typeof require !== 'undefined') {
  var Config = require('./Config');
}

var Database = {
  // Sheet Names
  SHEETS: {
    USERS: "USERS",
    COURSES: "COURSES",
    ENROLLMENTS: "ENROLLMENTS",
    ATTENDANCE: "ATTENDANCE",
    ASSIGNMENTS: "ASSIGNMENTS",
    SUBMISSIONS: "SUBMISSIONS",
    PAYMENTS: "PAYMENTS"
  },

  // Column Definitions (Schema)
  SCHEMA: {
    USERS: [
      "user_id", "email", "full_name", "phone", "role", "status", "password_hash"
    ],
    COURSES: [
      "course_id", "name", "lecturer_id", "level", "sks", "semester_period"
    ],
    ENROLLMENTS: [
      "enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"
    ],
    ATTENDANCE: [
      "attendance_id", "course_id", "student_id", "session_date", "status", "points"
    ],
    ASSIGNMENTS: [
      "assignment_id", "course_id", "type", "max_score"
    ],
    SUBMISSIONS: [
      "submission_id", "assignment_id", "student_id", "score"
    ],
    PAYMENTS: [
      "payment_id", "student_id", "amount", "proof_url", "status"
    ]
  },

  /**
   * Helper to access the Spreadsheet.
   * Uses Config.SPREADSHEET_ID.
   */
  _getSpreadsheet: function() {
    if (typeof SpreadsheetApp === 'undefined') {
      return null; // Local Environment
    }
    try {
      if (Config.SPREADSHEET_ID) {
        return SpreadsheetApp.openById(Config.SPREADSHEET_ID);
      }
      return SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      console.error("Database connection failed: " + e.toString());
      return null;
    }
  },

  /**
   * Helper to map Object to Array based on Schema.
   */
  _objectToArray: function(sheetName, dataObj) {
    var columns = this.SCHEMA[sheetName];
    if (!columns) throw new Error("Unknown Sheet: " + sheetName);

    var row = [];
    for (var i = 0; i < columns.length; i++) {
      var key = columns[i];
      row.push(dataObj[key] || ""); // Default to empty string if missing
    }
    return row;
  },

  /**
   * Save a single record to the database.
   * @param {string} sheetName - The name of the sheet (use Database.SHEETS.X)
   * @param {object} data - The data object to save
   */
  save: function(sheetName, data) {
    var ss = this._getSpreadsheet();

    if (ss) {
      // GAS Environment
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        // If sheet doesn't exist, create it and add headers
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(this.SCHEMA[sheetName]);
      }

      var rowData = this._objectToArray(sheetName, data);
      sheet.appendRow(rowData);
      return true;

    } else {
      // Local Node.js Environment (Mock)
      console.log("[MOCK DB] Saving to " + sheetName + ":", data);
      return true;
    }
  },

  /**
   * Find a user by email.
   * This implements a basic linear search. For large data, caching is needed.
   */
  findByEmail: function(email) {
    var ss = this._getSpreadsheet();
    if (ss) {
       var sheet = ss.getSheetByName(this.SHEETS.USERS);
       if (!sheet) return null;

       var data = sheet.getDataRange().getValues();
       // Assume email is index 1 based on SCHEMA
       var emailIndex = 1;

       for (var i = 1; i < data.length; i++) { // Start at 1 to skip header
         if (data[i][emailIndex] === email) {
           // Map back to object
           return this._rowToObject(this.SHEETS.USERS, data[i]);
         }
       }
       return null;
    } else {
      console.log("[MOCK DB] Finding email: " + email);
      return null;
    }
  },

  /**
   * Helper to map Array Row back to Object
   */
  _rowToObject: function(sheetName, rowArray) {
     var columns = this.SCHEMA[sheetName];
     var obj = {};
     for (var i = 0; i < columns.length; i++) {
       obj[columns[i]] = rowArray[i];
     }
     return obj;
  }
};

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = Database;
}
