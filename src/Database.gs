// src/Database.gs

/**
 * Helper to get a Sheet object
 */
function getSheet(sheetName) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
}

/**
 * Reads all data from a sheet as an array of objects.
 * Keys are taken from the header row.
 */
function getData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Appends a new row to a sheet.
 * @param {string} sheetName
 * @param {Object} dataObj - Object with keys matching sheet headers
 */
function insertData(sheetName, dataObj) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var row = headers.map(function(header) {
    return dataObj[header] || "";
  });

  sheet.appendRow(row);
  return dataObj;
}

/**
 * Updates a row based on a unique ID (first column usually, or specified).
 */
function updateData(sheetName, idColumn, idValue, updates) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf(idColumn);

  if (idIndex === -1) throw new Error("ID Column not found");

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIndex] == idValue) {
      // Found the row
      var row = data[i];
      for (var key in updates) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          row[colIndex] = updates[key];
          // Update the cell directly
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * Generates a unique ID
 */
function generateId() {
  return Utilities.getUuid();
}
