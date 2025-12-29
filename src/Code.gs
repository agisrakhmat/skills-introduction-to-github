/**
 * MAIN ENTRY POINT (Router)
 * Handles doGet and doPost requests from the frontend widgets.
 */

function doGet(e) {
  // Serve HTML templates if needed, or handle simple GET API calls
  var action = e.parameter.action;

  if (!action) {
    return HtmlService.createHtmlOutput("Diploma Ilmi LMS Backend is Running.");
  }

  var result = handleApiRequest(action, e.parameter);
  return createJSONOutput(result);
}

function doPost(e) {
  // Lock Service (GAS only) to prevent race conditions
  var lock = null;
  if (typeof LockService !== 'undefined') {
      lock = LockService.getScriptLock();
      try {
        lock.waitLock(30000); // Wait up to 30 sec
      } catch (e) {
        return createJSONOutput({ success: false, message: 'Server is busy, please try again.' });
      }
  }

  try {
    // Handle POST API calls (Forms, Uploads)
    var action = e.parameter.action;

    // Parse payload (assuming JSON body or form data)
    var data = e.postData ? JSON.parse(e.postData.contents) : e.parameter;

    var result = handleApiRequest(action, data);
    return createJSONOutput(result);
  } finally {
    if (lock) lock.releaseLock();
  }
}

/**
 * API Router Switch
 */
function handleApiRequest(action, data) {
  try {
    switch (action) {
      case 'register':
        return registerStudent(data);
      case 'login':
        return loginUser(data.identifier, data.password);
      case 'test_connection':
        return { success: true, message: 'Backend connected!' };
      default:
        return { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    return { success: false, message: 'Server Error: ' + err.toString() };
  }
}

/**
 * Helper: JSON Response
 */
function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
