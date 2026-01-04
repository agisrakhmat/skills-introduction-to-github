// Constants for Sheet Names
const SHEET_NAMES = {
  USERS: 'USERS',
  COURSES: 'COURSES',
  ENROLLMENTS: 'ENROLLMENTS',
  ATTENDANCE: 'ATTENDANCE',
  ASSIGNMENTS: 'ASSIGNMENTS',
  SUBMISSIONS: 'SUBMISSIONS',
  PAYMENTS: 'PAYMENTS'
};

const DB_ID = '18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE'; // From memory, but user provided spec implies a new system.
// However, I will use a placeholder or config. The spec doesn't specify the ID, so I'll assume it's the active spreadsheet or a configured ID.
// For now, I'll use a function to get the DB.

var Database = {
  /**
   * Gets the spreadsheet object.
   * If running in GAS, uses SpreadsheetApp.
   * If DB_ID is provided, opens by ID, otherwise getActiveSpreadsheet.
   */
  getDb: function() {
    if (typeof SpreadsheetApp === 'undefined') {
      throw new Error('SpreadsheetApp is not defined (Running outside GAS?)');
    }
    // Return active spreadsheet or open by ID if needed.
    // Using active spreadsheet is common for container-bound scripts.
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * Generic function to get all data from a sheet as an array of objects.
   * Assumes the first row contains headers.
   */
  getTable: function(tableName) {
    const ss = this.getDb();
    const sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      console.error('Sheet not found: ' + tableName);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; // No data

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  },

  /**
   * Generic function to append a row to a sheet.
   * @param {string} tableName
   * @param {Object} rowData - Object matching header keys
   */
  insert: function(tableName, rowData) {
    const ss = this.getDb();
    const sheet = ss.getSheetByName(tableName);
    if (!sheet) throw new Error('Sheet not found: ' + tableName);

    // Get headers to ensure order
    const lastCol = sheet.getLastColumn();
    // If lastCol is 0, we can't get range.
    if (lastCol === 0) throw new Error('Sheet has no headers');

    const range = sheet.getRange(1, 1, 1, lastCol);
    const values = range.getValues();
    const headers = values[0];

    // Debugging
    // console.log('Headers found:', headers);

    const row = headers.map(header => rowData[header] || '');

    // In GAS, appendRow takes an array.
    // In my mock, I might have messed up how appendRow works or how getValues works.
    // The test shows mockData has [headers, []]. The second row is empty array?
    // Oh, row.map returns an array. appendRow(row) pushes that array.
    // If the mapping fails, it might be empty?

    // Debugging:
    console.log('Inserting row:', row);

    sheet.appendRow(row);
    return rowData;
  },

  /**
   * Update a row based on a key column.
   */
  update: function(tableName, keyColumn, keyValue, updateData) {
    const ss = this.getDb();
    const sheet = ss.getSheetByName(tableName);
    if (!sheet) throw new Error('Sheet not found: ' + tableName);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyIndex = headers.indexOf(keyColumn);

    if (keyIndex === -1) throw new Error('Key column not found: ' + keyColumn);

    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] == keyValue) {
        // Found row, update it
        const rowNumber = i + 1;
        headers.forEach((header, colIndex) => {
          if (updateData.hasOwnProperty(header)) {
            sheet.getRange(rowNumber, colIndex + 1).setValue(updateData[header]);
          }
        });
        return true;
      }
    }
    return false;
  },

  /**
   * Simple query to find rows matching a predicate.
   */
  query: function(tableName, predicate) {
    const table = this.getTable(tableName);
    return table.filter(predicate);
  }
};

// Export for testing if needed (Node.js environment)
if (typeof module !== 'undefined') {
  module.exports = { Database, SHEET_NAMES };
}
