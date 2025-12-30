/**
 * DatabaseWrapper.gs
 * Handles interactions with Google Sheets database.
 */

// Configuration
var SPREADSHEET_ID = '1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA';
var CACHE_EXPIRATION_SEC = 1500; // 25 minutes

// Table Names (Sheet Names)
var TABLES = {
  USERS: 'USERS',
  COURSES: 'COURSES',
  ENROLLMENTS: 'ENROLLMENTS',
  ATTENDANCE: 'ATTENDANCE',
  ASSIGNMENTS: 'ASSIGNMENTS',
  SUBMISSIONS: 'SUBMISSIONS',
  PAYMENTS: 'PAYMENTS',
  CERTIFICATES: 'CERTIFICATES'
};

// Mock Database for local testing
var MOCK_DB = {};

/**
 * Helper to get the spreadsheet object.
 * In local environment, this returns null or mock.
 */
function getSpreadsheet() {
  if (typeof SpreadsheetApp === 'undefined') {
    return null; // Local environment
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Reads all data from a table.
 * Uses CacheService to cache data for 15-25 minutes.
 * @param {string} tableName
 * @returns {Array<Object>} List of objects keyed by header.
 */
function readTable(tableName) {
  if (typeof SpreadsheetApp === 'undefined') {
    return MOCK_DB[tableName] || [];
  }

  // Try Cache
  var cache = CacheService.getScriptCache();
  var cached = cache.get(tableName);
  if (cached) {
      return JSON.parse(cached);
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var rows = data.slice(1);

  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });

  // Store in Cache (approx 15 min)
  try {
      cache.put(tableName, JSON.stringify(result), 900);
  } catch (e) {
      // Ignore cache errors (e.g. size limit)
  }

  return result;
}

/**
 * Invalidates cache for a table.
 */
function invalidateCache(tableName) {
    if (typeof CacheService !== 'undefined') {
        CacheService.getScriptCache().remove(tableName);
    }
}

/**
 * Appends a row to a table.
 * @param {string} tableName
 * @param {Object} dataRow Object with keys matching headers.
 * @returns {boolean} Success status.
 */
function appendRow(tableName, dataRow) {
  if (typeof SpreadsheetApp === 'undefined') {
    if (!MOCK_DB[tableName]) MOCK_DB[tableName] = [];
    MOCK_DB[tableName].push(dataRow);
    return true;
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    // Auto-create sheet if not exists (for convenience)
    sheet = ss.insertSheet(tableName);
    // Add headers from keys
    var headers = Object.keys(dataRow);
    sheet.appendRow(headers);
  }

  // Ensure headers match or find indices
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowToAppend = headers.map(function(header) {
    return dataRow[header] || '';
  });

  sheet.appendRow(rowToAppend);
  invalidateCache(tableName);
  return true;
}

/**
 * Updates a row in a table based on a primary key.
 * Optimized for batch update.
 * @param {string} tableName
 * @param {string} pkColumn Name of the PK column.
 * @param {string} pkValue Value of the PK to find.
 * @param {Object} updates Object containing fields to update.
 * @returns {boolean} Success status.
 */
function updateRow(tableName, pkColumn, pkValue, updates) {
  if (typeof SpreadsheetApp === 'undefined') {
    var table = MOCK_DB[tableName] || [];
    for (var i = 0; i < table.length; i++) {
      if (table[i][pkColumn] == pkValue) {
        for (var key in updates) {
          table[i][key] = updates[key];
        }
        return true;
      }
    }
    return false;
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var pkIndex = headers.indexOf(pkColumn);

  if (pkIndex === -1) return false;

  for (var i = 1; i < data.length; i++) {
    if (data[i][pkIndex] == pkValue) {
      // Found row
      var row = data[i];
      var needsUpdate = false;

      for (var key in updates) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          row[colIndex] = updates[key];
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
          sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      }

      invalidateCache(tableName);
      return true;
    }
  }
  return false;
}

/**
 * Finds a single row.
 * @param {string} tableName
 * @param {string} column
 * @param {any} value
 * @returns {Object|null}
 */
function findRow(tableName, column, value) {
  var rows = readTable(tableName);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][column] == value) {
      return rows[i];
    }
  }
  return null;
}

/**
 * Finds multiple rows.
 * @param {string} tableName
 * @param {string} column
 * @param {any} value
 * @returns {Array<Object>}
 */
function findRows(tableName, column, value) {
  var rows = readTable(tableName);
  return rows.filter(function(row) {
    return row[column] == value;
  });
}

/**
 * Deletes a row.
 * @param {string} tableName
 * @param {string} pkColumn
 * @param {any} pkValue
 */
function deleteRow(tableName, pkColumn, pkValue) {
    if (typeof SpreadsheetApp === 'undefined') {
        if (!MOCK_DB[tableName]) return false;
        MOCK_DB[tableName] = MOCK_DB[tableName].filter(row => row[pkColumn] != pkValue);
        return true;
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) return false;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var pkIndex = headers.indexOf(pkColumn);

    if (pkIndex === -1) return false;

    for (var i = 1; i < data.length; i++) {
        if (data[i][pkIndex] == pkValue) {
            sheet.deleteRow(i + 1);
            return true;
        }
    }
    return false;
}
