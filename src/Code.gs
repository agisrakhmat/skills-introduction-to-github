/**
 * Code.gs
 * Entry point utama (Router) untuk Web App Google Apps Script.
 */

// Import Modul (Penting: Mekanisme require ini hanya untuk lokal Node.js,
// di GAS semua file .gs dimuat secara global. Kita pakai pola pengecekan.)

var IsNodeEnv = (typeof module !== 'undefined' && module.exports);

if (IsNodeEnv) {
  var AuthController = require('./Controllers/AuthController.gs');
  var Config = require('./Config.gs');
}

/**
 * Menangani Request GET
 */
function doGet(e) {
  return ContentService.createTextOutput("Diploma Ilmi LMS Backend is Online.");
}

/**
 * Menangani Request POST
 * Router utama untuk semua aksi (Login, Data, dll)
 */
function doPost(e) {
  // Parsing Body JSON
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: "Invalid JSON format." });
  }

  var action = data.action;

  // Routing berdasarkan 'action'
  switch (action) {
    case 'login':
      return jsonResponse(AuthController.login(data));

    // case 'register': ...
    // case 'get_student_data': ...

    default:
      return jsonResponse({ success: false, message: "Action tidak dikenal: " + action });
  }
}

/**
 * Helper: Membuat Output JSON Standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Export untuk testing
if (IsNodeEnv) {
  module.exports = {
    doPost: doPost
  };
}
