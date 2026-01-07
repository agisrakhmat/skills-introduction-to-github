
var Database = {
  spreadsheetId: null,

  getSpreadsheet: function() {
    if (this.spreadsheetId) return SpreadsheetApp.openById(this.spreadsheetId);
    var props = PropertiesService.getScriptProperties();
    this.spreadsheetId = props.getProperty("SPREADSHEET_ID");
    if (!this.spreadsheetId) throw new Error("Database belum disetup. Jalankan doSetup()!");
    return SpreadsheetApp.openById(this.spreadsheetId);
  },

  getSheet: function(sheetName) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan.");
    return sheet;
  },

  // Read all data with caching
  getAll: function(sheetName) {
    var cache = CacheService.getScriptCache();
    var cached = cache.get("DATA_" + sheetName);
    if (cached) {
      return JSON.parse(cached);
    }

    var sheet = this.getSheet(sheetName);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers or empty

    var headers = data[0];
    var rows = data.slice(1);

    var result = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });

    // Cache for 15 minutes (approx 900s), user asked for 15-30 mins
    try {
        cache.put("DATA_" + sheetName, JSON.stringify(result), 900);
    } catch (e) {
        // Ignore cache errors (e.g. size limit)
        console.log("Cache put error for " + sheetName + ": " + e.message);
    }

    return result;
  },

  // Clear cache for a sheet
  clearCache: function(sheetName) {
    CacheService.getScriptCache().remove("DATA_" + sheetName);
  },

  // Insert one row with Lock
  insert: function(sheetName, dataObj) {
    var lock = LockService.getScriptLock();
    // Wait for up to 30 seconds for other processes to finish.
    lock.waitLock(30000);

    try {
      var sheet = this.getSheet(sheetName);
      // We need headers to know order
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      var newRow = headers.map(function(header) {
        return dataObj[header] || "";
      });

      sheet.appendRow(newRow);
      this.clearCache(sheetName);
      return true;
    } catch (e) {
      throw e;
    } finally {
      lock.releaseLock();
    }
  },

  // Bulk update (read all, update in memory, write all)
  // This is optimized for Spreadsheet limits
  update: function(sheetName, keyCol, keyVal, updateData) {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var sheet = this.getSheet(sheetName);
      var range = sheet.getDataRange();
      var data = range.getValues();
      var headers = data[0];

      var keyIndex = headers.indexOf(keyCol);
      if (keyIndex === -1) throw new Error("Kolom " + keyCol + " tidak ditemukan.");

      var modified = false;

      // Modify data in memory
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][keyIndex]) === String(keyVal)) {
            // Found row, update columns
            for (var key in updateData) {
                var colIndex = headers.indexOf(key);
                if (colIndex > -1) {
                    data[i][colIndex] = updateData[key];
                }
            }
            modified = true;
            break; // Stop after first match? Assuming unique key. If not, remove break.
        }
      }

      if (modified) {
          range.setValues(data);
          this.clearCache(sheetName);
      }
      return modified;
    } finally {
      lock.releaseLock();
    }
  },

  // Delete row(s)
  delete: function(sheetName, keyCol, keyVal) {
      var lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
          var sheet = this.getSheet(sheetName);
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var keyIndex = headers.indexOf(keyCol);
          if (keyIndex === -1) throw new Error("Kolom " + keyCol + " tidak ditemukan.");

          // Filter out rows (Create new array)
          var newData = [headers];
          var deleted = false;
          for (var i = 1; i < data.length; i++) {
              if (String(data[i][keyIndex]) !== String(keyVal)) {
                  newData.push(data[i]);
              } else {
                  deleted = true;
              }
          }

          if (deleted) {
              sheet.clearContents();
              // Write back if we have data left (headers + rows)
              if (newData.length > 0) {
                  sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
              }
              this.clearCache(sheetName);
          }
          return deleted;
      } finally {
          lock.releaseLock();
      }
  },

  // Simple helper to find one
  findOne: function(sheetName, keyCol, keyVal) {
      var all = this.getAll(sheetName);
      for(var i=0; i<all.length; i++) {
          if(String(all[i][keyCol]) === String(keyVal)) {
              return all[i];
          }
      }
      return null;
  }
};

if (typeof module !== 'undefined') module.exports = Database;
