// src/Code.js

// Ensure dependencies are loaded (for GAS environment, they are global, for Node, we require them)
if (typeof module !== 'undefined') {
  var Service = require('./Service');
}

/**
 * Handle GET requests (Frontend fetch).
 * URL: script_url?nim=...&phone=...
 */
function doGet(e) {
  var output = {};

  try {
    // Check parameters
    if (!e || !e.parameter) {
        throw new Error("Invalid request parameters.");
    }

    var nim = e.parameter.nim;
    var phone = e.parameter.phone;

    // Process
    output = Service.processGrades(nim, phone);

  } catch (err) {
    output = {
      status: 'error',
      message: 'Terjadi kesalahan server: ' + err.toString()
    };
  }

  return _jsonResponse(output);
}

/**
 * Helper to return JSON response
 */
function _jsonResponse(data) {
  if (typeof ContentService === 'undefined') {
      return JSON.stringify(data); // For local test
  }
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Ensure exports for testing
if (typeof module !== 'undefined') {
  module.exports = {
    doGet: doGet
  };
}
