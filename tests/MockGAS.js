// tests/MockGAS.js

// Mocking Google Apps Script Services

global.Logger = {
  log: function(msg) { console.log("Logger:", msg); }
};

global.Utilities = {
  getUuid: function() { return 'uuid-' + Math.random().toString(36).substr(2, 9); },
  base64Encode: function(str) { return Buffer.from(str).toString('base64'); },
  base64Decode: function(str) { return Buffer.from(str, 'base64').toString('utf8'); },
  newBlob: function(data) {
    return {
      getDataAsString: function() { return data; }
    };
  }
};

global.ContentService = {
  MimeType: { JSON: 'JSON' },
  createTextOutput: function(content) {
    return {
      setMimeType: function(type) { return this; },
      getContent: function() { return content; }
    }
  }
};

global.LockService = {
  getScriptLock: function() {
    return {
      waitLock: function(ms) {},
      releaseLock: function() {}
    };
  }
};

// Mock SpreadsheetApp and Sheet
class MockSheet {
  constructor(name) {
    this.name = name;
    this.data = []; // 2D array
  }

  appendRow(row) {
    this.data.push(row);
  }

  getDataRange() {
    return {
      getValues: () => this.data
    };
  }

  getLastColumn() {
    return this.data.length > 0 ? this.data[0].length : 0;
  }

  getLastRow() {
    return this.data.length;
  }

  getRange(row, col, numRows, numCols) {
    return {
      getValues: () => {
        // Return sub-array
        // Simplified: assuming request is for header row usually in this code
        if (row === 1) return [this.data[0]];
        return [];
      },
      setValue: (val) => {
        // row is 1-based
        if (this.data[row-1]) {
            this.data[row-1][col-1] = val;
        }
      }
    };
  }

  setFrozenRows(n) {}
}

class MockSpreadsheet {
  constructor(id) {
    this.id = id;
    this.sheets = {};
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    this.sheets[name] = new MockSheet(name);
    return this.sheets[name];
  }
}

var DB = new MockSpreadsheet("MOCK_ID");

global.SpreadsheetApp = {
  openById: function(id) {
    return DB;
  }
};

// Export for setup in test runner
module.exports = { DB };
