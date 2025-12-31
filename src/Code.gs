// Code.gs
// Main Entry Point for Google Apps Script

// Import Controllers (In GAS, they are in the same scope, but for structure we keep comments)
// In GAS, all files are global.

function doGet(e) {
  // Routing logic for HTML pages
  var page = e.parameter.page || 'login';
  // Use HtmlService to create output
  // return HtmlService.createTemplateFromFile(page).evaluate();
  return ContentService.createTextOutput("Diplom Ilmi Backend Running");
}

function doPost(e) {
  // Global Lock to prevent race conditions
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait 30s

    // Parse Payload
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = {};

    // Routing
    if (action === 'login') {
      result = AuthController.login(data.identifier, data.password);
    } else if (action === 'register') {
      result = AuthController.registerStudent(data.fullName, data.email, data.phone);
    } else if (action === 'check_enrollment') {
      result = AcademicController.canEnrollInLevel(data.studentId, data.targetLevel);
    }
    // ... other routes

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
