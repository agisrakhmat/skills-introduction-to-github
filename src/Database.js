var Database = {
  Schema: {
    USERS: {
      name: "USERS",
      columns: ["user_id", "email", "full_name", "phone", "role", "status", "password_hash"],
      indices: { user_id: 0, email: 1, phone: 3 }
    },
    // ... other schemas remain conceptually same, but for brevity/efficiency in GAS
    // we focus on dynamic access.
    COURSES: { name: "COURSES", columns: ["course_id", "name", "lecturer_id", "level", "sks", "semester_period"] },
    ENROLLMENTS: { name: "ENROLLMENTS", columns: ["enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"] },
    ATTENDANCE: { name: "ATTENDANCE", columns: ["attendance_id", "course_id", "student_id", "session_date", "status", "points"] },
    ASSIGNMENTS: { name: "ASSIGNMENTS", columns: ["assignment_id", "course_id", "type", "max_score"] },
    SUBMISSIONS: { name: "SUBMISSIONS", columns: ["submission_id", "assignment_id", "student_id", "score"] },
    PAYMENTS: { name: "PAYMENTS", columns: ["payment_id", "student_id", "amount", "proof_url", "status"] }
  },

  getConnection: function() {
    if (typeof SpreadsheetApp !== 'undefined') {
      return SpreadsheetApp.openById(Config.SPREADSHEET_ID);
    }
    throw new Error("Cannot connect to Database in local environment without mocking.");
  },

  // Generic Insert
  insert: function(tableName, dataObject) {
    var ss = this.getConnection();
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) throw new Error("Sheet not found: " + tableName);

    var schema = this.Schema[tableName];
    var row = [];

    // Map object to array based on column order
    for (var i = 0; i < schema.columns.length; i++) {
      var colName = schema.columns[i];
      row.push(dataObject[colName] || "");
    }

    sheet.appendRow(row);
    return true;
  },

  // Generic Find One
  findOne: function(tableName, key, value) {
    var ss = this.getConnection();
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) return null;

    var data = sheet.getDataRange().getValues();
    var schema = this.Schema[tableName];
    var colIndex = schema.columns.indexOf(key);

    if (colIndex === -1) throw new Error("Invalid column: " + key);

    // Start from row 1 (skip header)
    for (var i = 1; i < data.length; i++) {
      if (data[i][colIndex] == value) { // Loose equality for numbers/strings
        return this._mapRowToObject(data[i], schema.columns);
      }
    }
    return null;
  },

  // Helper to map array to object
  _mapRowToObject: function(row, columns) {
    var obj = {};
    for (var i = 0; i < columns.length; i++) {
      obj[columns[i]] = row[i];
    }
    return obj;
  }
};

if (typeof module !== "undefined") {
  module.exports = Database;
}
