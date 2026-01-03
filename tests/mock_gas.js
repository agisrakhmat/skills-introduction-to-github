const crypto = require('crypto');

// Mock Session
global.Session = {
  getScriptTimeZone: () => 'GMT'
};

// Mock Utilities
global.Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  MacAlgorithm: { HMAC_SHA_256: 'HMAC_SHA_256' },

  computeDigest: function(algo, value) {
    if (algo === 'SHA_256') {
      return Array.from(crypto.createHash('sha256').update(value).digest());
    }
    return [];
  },

  computeHmacSignature: function(algo, value, key) {
    if (algo === 'HMAC_SHA_256') {
      return Array.from(crypto.createHmac('sha256', key).update(value).digest());
    }
    return [];
  },

  base64EncodeWebSafe: function(value) {
    let buffer;
    if (Buffer.isBuffer(value)) buffer = value;
    else if (Array.isArray(value)) buffer = Buffer.from(value);
    else buffer = Buffer.from(String(value));

    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },

  base64DecodeWebSafe: function(value) {
     let str = value.replace(/-/g, '+').replace(/_/g, '/');
     while (str.length % 4) str += '=';
     return Array.from(Buffer.from(str, 'base64'));
  },

  newBlob: function(data) {
    let buffer = Array.isArray(data) ? Buffer.from(data) : Buffer.from(data);
    return {
      getDataAsString: () => buffer.toString()
    };
  },

  formatDate: function(d, tz, fmt) { return new Date(d).toISOString(); },
  getUuid: function() { return 'uuid-' + Math.random(); }
};

// Mock ContentService
global.ContentService = {
  MimeType: { JSON: 'JSON' },
  createTextOutput: function(content) {
    return {
      setMimeType: function() { return this; },
      getContent: function() { return content; }
    };
  }
};

// Mock LockService
global.LockService = {
  getScriptLock: function() {
    return {
      waitLock: function() {},
      releaseLock: function() {}
    };
  }
};

// Mock CacheService
var cacheStore = {};
global.CacheService = {
  getScriptCache: function() {
    return {
      get: (key) => cacheStore[key],
      put: (key, value, time) => { cacheStore[key] = value; },
      remove: (key) => { delete cacheStore[key]; }
    };
  }
};

// Mock SpreadsheetApp
var sheets = {}; // Map name -> rows[]

global.SpreadsheetApp = {
  openById: function(id) { return this; },
  getActiveSpreadsheet: function() { return this; },

  getSheetByName: function(name) {
    if (!sheets[name]) return null;
    return {
      getDataRange: function() {
        return {
          getValues: function() { return sheets[name]; }
        };
      },
      appendRow: function(row) {
        sheets[name].push(row);
      }
    };
  },

  insertSheet: function(name) {
    sheets[name] = [];
    return {
      appendRow: function(row) {
        sheets[name].push(row);
      }
    };
  },

  // Helper for tests to seed data
  _seed: function(name, data) {
    sheets[name] = data;
  },
  _reset: function() {
    sheets = {};
    cacheStore = {};
  }
};
