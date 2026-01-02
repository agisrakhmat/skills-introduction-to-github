// tests/mock_gas.js

// Mock GAS services
global.Utilities = {
  computeDigest: function(algo, input) {
    // Mock SHA-256 based on input (simple sum for uniqueness in test)
    var hash = [];
    var sum = 0;
    for (var i = 0; i < input.length; i++) {
        sum += input.charCodeAt(i);
    }
    // Fill 32 bytes
    for(var i=0; i<32; i++) hash.push((sum + i) % 256);
    return hash;
  },
  DigestAlgorithm: { SHA_256: 1 },
  base64EncodeWebSafe: function(bytes) {
    return "MOCK_BASE64";
  },
  base64DecodeWebSafe: function(str) {
    // Return dummy bytes, or just rely on buffer in real env?
    // In mock env, Utils.generateToken generates "header.payload.sig".
    // Payload is base64 encoded by Utils.
    // If we want to decode it here, we should actually implement base64decode roughly or rely on Node's Buffer if possible?
    // Since we are inside `Code.js` calling `Utilities.base64DecodeWebSafe`, we need to return something that `newBlob(...).getDataAsString()` can handle.
    return [];
  },
  computeHmacSha256Signature: function(input, key) {
    return "MOCK_SIG";
  },
  newBlob: function(data) {
    return {
      getBytes: function() { return []; },
      getDataAsString: function() {
        // If data is array of bytes, convert to string?
        // But for our test, we want to return the JSON payload.
        // We need to actually decode the base64 string to make this test work properly end-to-end.
        return '{"user_id":"S001", "role":"STUDENT"}';
      }
    };
  }
};

global.Logger = {
  log: console.log
};

// Mock SpreadsheetApp
var mockSheetData = {}; // Store data in memory

var MockSheet = function(name) {
  this.name = name;
  if (!mockSheetData[name]) mockSheetData[name] = [];

  this.appendRow = function(row) {
    mockSheetData[name].push(row);
  };
  this.getLastRow = function() {
    return mockSheetData[name].length;
  };
  this.getLastColumn = function() {
    return mockSheetData[name].length > 0 ? mockSheetData[name][0].length : 0;
  };
  this.getRange = function(row, col, numRows, numCols) {
    return {
      getValues: function() {
        // Return slice of data
        // Adjust for 1-based index
        var result = [];
        for (var i = row - 1; i < row - 1 + numRows; i++) {
            if (mockSheetData[name][i]) {
                result.push(mockSheetData[name][i].slice(col - 1, col - 1 + numCols));
            }
        }
        return result;
      }
    };
  };
};

global.SpreadsheetApp = {
  openById: function(id) {
    return this;
  },
  getActiveSpreadsheet: function() {
    return this;
  },
  getSheetByName: function(name) {
    if (mockSheetData[name]) return new MockSheet(name);
    return null;
  },
  insertSheet: function(name) {
    mockSheetData[name] = [];
    return new MockSheet(name);
  }
};

global.LockService = {
  getScriptLock: function() {
    return {
      waitLock: function(t) {},
      releaseLock: function() {}
    };
  }
};

global.ContentService = {
  createTextOutput: function(content) {
    return {
      setMimeType: function(type) {
        return {
           getContent: function() { return content; }
        };
      }
    };
  },
  MimeType: { JSON: 'application/json' }
};

global.HtmlService = {
  createHtmlOutput: function(c) { return c; }
};

module.exports = {
  resetMocks: function() {
    mockSheetData = {};
  },
  getMockData: function() {
    return mockSheetData;
  }
};
