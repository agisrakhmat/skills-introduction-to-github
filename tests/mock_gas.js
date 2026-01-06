/**
 * Mock Google Apps Script Services for Local Testing
 * This file simulates the Google Apps Script environment (SpreadsheetApp, Logger, etc.)
 * so we can run logic tests in Node.js without deploying.
 */

const fs = require('fs');

// In-memory database to simulate Spreadsheet
let MOCK_DB = {};

const MockRange = class {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const data = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowData = [];
      for (let c = 0; c < this.numCols; c++) {
        // Arrays are 0-indexed, Sheets are 1-indexed
        const val = this.sheet.data[this.row + r - 1]?.[this.col + c - 1] || "";
        rowData.push(val);
      }
      data.push(rowData);
    }
    return data;
  }

  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        if (!this.sheet.data[this.row + r - 1]) {
          this.sheet.data[this.row + r - 1] = [];
        }
        this.sheet.data[this.row + r - 1][this.col + c - 1] = values[r][c];
      }
    }
  }

  setValue(value) {
      this.setValues([[value]]);
  }
};

const MockSheet = class {
  constructor(name) {
    this.name = name;
    this.data = []; // 2D array
    this.lastRow = 0;
    this.lastCol = 0;
  }

  getName() { return this.name; }

  getDataRange() {
    this.recalculateBounds();
    // Default to 1,1 if empty
    const rows = Math.max(1, this.lastRow);
    const cols = Math.max(1, this.lastCol);
    return new MockRange(this, 1, 1, rows, cols);
  }

  getRange(row, col, numRows, numCols) {
    // Handling getRange(row, col) -> single cell
    if (numRows === undefined) numRows = 1;
    if (numCols === undefined) numCols = 1;
    return new MockRange(this, row, col, numRows, numCols);
  }

  appendRow(rowContents) {
    this.recalculateBounds();
    const newRowIndex = this.lastRow; // 0-based index for the new row
    this.data[newRowIndex] = rowContents;
    this.lastRow++;
    if (rowContents.length > this.lastCol) this.lastCol = rowContents.length;
  }

  getLastRow() {
    this.recalculateBounds();
    return this.lastRow;
  }

  clear() {
      this.data = [];
      this.lastRow = 0;
      this.lastCol = 0;
  }

  recalculateBounds() {
    this.lastRow = this.data.length;
    this.lastCol = 0;
    this.data.forEach(row => {
      if (row && row.length > this.lastCol) this.lastCol = row.length;
    });
  }
};

const MockSpreadsheet = class {
  constructor(id) {
    this.id = id;
  }

  getSheetByName(name) {
    if (!MOCK_DB[this.id]) MOCK_DB[this.id] = {};
    if (!MOCK_DB[this.id][name]) return null;
    return MOCK_DB[this.id][name];
  }

  insertSheet(name) {
    if (!MOCK_DB[this.id]) MOCK_DB[this.id] = {};
    const newSheet = new MockSheet(name);
    MOCK_DB[this.id][name] = newSheet;
    return newSheet;
  }

  getId() { return this.id; }
};

const SpreadsheetApp = {
  openById: (id) => {
    return new MockSpreadsheet(id);
  },
  getActiveSpreadsheet: () => {
    return new MockSpreadsheet("ACTIVE_SHEET_ID");
  }
};

const Logger = {
  log: (msg) => console.log(`[GAS Logger] ${msg}`)
};

const LockService = {
  getScriptLock: () => ({
    tryLock: (timeout) => true,
    releaseLock: () => {}
  })
};

const Utilities = {
  base64Decode: (str) => Buffer.from(str, 'base64'),
  newBlob: (data, mime, name) => ({ getDataAsString: () => data.toString() }),
  computeDigest: (algorithm, value) => {
      // Simple mock for SHA-256
      const crypto = require('crypto');
      // GAS computeDigest returns signed byte array.
      // We will just return a mocked byte array or hex string depending on usage?
      // Usually users convert this to hex.
      // For this mock, let's return the Buffer which is somewhat compatible if they loop over it.
      if (algorithm === Utilities.DigestAlgorithm.SHA_256) {
          const hash = crypto.createHash('sha256').update(value).digest();
          // Convert Buffer to array of signed bytes (Java byte style)
          const bytes = [];
          for (const b of hash) {
              bytes.push(b > 127 ? b - 256 : b);
          }
          return bytes;
      }
      return [];
  },
  DigestAlgorithm: {
      SHA_256: 'SHA_256'
  },
  formatDate: (date, timeZone, format) => {
      // Simple mock, ignores timezone, assumes usage of simple formats
      return date.toISOString().split('T')[0];
  }
};

const Session = {
    getActiveUser: () => ({ getEmail: () => "test@example.com" })
};

// Export to global scope
global.SpreadsheetApp = SpreadsheetApp;
global.Logger = Logger;
global.LockService = LockService;
global.Utilities = Utilities;
global.Session = Session;

module.exports = { MOCK_DB };
