
// MOCK GOOGLE APPS SCRIPT SERVICES

// --- GLOBALS ---
global.MimeType = {
    JPEG: 'image/jpeg',
    PDF: 'application/pdf',
    JSON: 'application/json'
};

// --- UTILITIES ---
global.Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  computeDigest: function(algo, str) {
    // Simple mock hash: return array of bytes
    var hash = [];
    for(var i=0; i<str.length; i++) hash.push(str.charCodeAt(i));
    return hash;
  },
  base64Decode: function(str) { return str; },
  newBlob: function(data, mime, name) { return { data: data, mime: mime, name: name }; }
};

// --- PROPERTIES SERVICE ---
var _props = {};
global.PropertiesService = {
  getScriptProperties: function() {
    return {
      getProperty: function(key) { return _props[key]; },
      setProperty: function(key, val) { _props[key] = val; }
    };
  }
};

// --- LOCK SERVICE ---
global.LockService = {
  getScriptLock: function() {
    return {
      waitLock: function(ms) { return true; },
      releaseLock: function() { return true; }
    };
  }
};

// --- CACHE SERVICE ---
var _cache = {};
global.CacheService = {
  getScriptCache: function() {
    return {
      get: function(key) { return _cache[key]; },
      put: function(key, val, sec) { _cache[key] = val; },
      remove: function(key) { delete _cache[key]; }
    };
  }
};

// --- CONTENT SERVICE ---
global.ContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput: function(content) {
    return {
      setMimeType: function(t) {
          this.mime = t;
          return this;
      },
      getContent: function() { return content; } // For testing
    };
  }
};

// --- DRIVE APP ---
global.DriveApp = {
  Access: { ANYONE_WITH_LINK: 'ANYONE' },
  Permission: { VIEW: 'VIEW' },
  createFolder: function(name) { return { getId: function() { return "FOLDER_ID_" + name; } }; },
  getFoldersByName: function(name) {
      // Simulates no folder first time
      return { hasNext: function() { return false; }, next: function() { return null; } };
  },
  getFolderById: function(id) {
      return {
          createFile: function(blob) {
              return { getUrl: function() { return "http://drive/file/" + blob.name; }, setSharing: function(){} };
          }
      };
  },
  getFileById: function(id) {
      return {
          makeCopy: function(name, folder) {
              return { getId: function() { return "NEW_FILE_" + name; }, setTrashed: function(){} };
          }
      };
  }
};

// --- SLIDES APP ---
global.SlidesApp = {
    openById: function(id) {
        return {
            getSlides: function() {
                return [{
                    replaceAllText: function(tag, text) { console.log("Slide Replace: " + tag + " -> " + text); }
                }];
            },
            saveAndClose: function() {}
        };
    }
};

// --- SPREADSHEET APP (The Big One) ---
var _sheets = {}; // Map name -> SheetObj
global.SpreadsheetApp = {
  create: function(name) {
    var id = "SS_ID_" + name;
    return {
      getId: function() { return id; },
      getSheetByName: function(n) { return _sheets[n]; },
      insertSheet: function(n) {
          var s = new MockSheet(n);
          _sheets[n] = s;
          return s;
      },
      getSheets: function() { return Object.values(_sheets); },
      deleteSheet: function(s) { delete _sheets[s.getName()]; }
    };
  },
  openById: function(id) {
      return this.create("EXISTING"); // Reuse logic
  }
};

function MockSheet(name) {
    this.name = name;
    this.data = []; // 2D Array

    this.getName = function() { return this.name; };
    this.appendRow = function(row) { this.data.push(row); };
    this.getLastColumn = function() { return this.data.length > 0 ? this.data[0].length : 0; };
    this.getLastRow = function() { return this.data.length; };
    this.getDataRange = function() {
        var self = this;
        return {
            getValues: function() { return self.data; },
            setValues: function(newVal) { self.data = newVal; }
        };
    };
    this.getRange = function(r, c, nr, nc) {
        var self = this;
        return {
            getValues: function() {
                // Slice data
                var res = [];
                for(var i=0; i<nr; i++) {
                    if (self.data[r-1+i]) res.push(self.data[r-1+i].slice(c-1, c-1+nc));
                }
                return res;
            },
            setValues: function(v) {
                // Set data (simple impl)
                for(var i=0; i<nr; i++) {
                    if(!self.data[r-1+i]) self.data[r-1+i] = [];
                    for(var j=0; j<nc; j++) {
                        self.data[r-1+i][c-1+j] = v[i][j];
                    }
                }
            }
        };
    };
    this.clearContents = function() { this.data = []; };
}
