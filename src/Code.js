// src/Code.js

// Ensure dependencies are loaded for Node.js testing
if (typeof module !== 'undefined' && typeof require !== 'undefined') {
  var Utils = require('./Utils');
  var Database = require('./Database');
  var Auth = require('./Auth');
  var Student = require('./Student');
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Diploma Ilmi LMS Backend is Running");
}

function doPost(e) {
  // Lock mechanism for concurrency
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait for up to 10 seconds
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(Utils.createResponse(false, 'Server busy, try again later.')))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
       try {
         params = JSON.parse(e.postData.contents);
       } catch (jsonErr) {
         // Fallback for form-data
         params = e.parameter;
       }
    } else if (e && e.parameter) {
       params = e.parameter;
    }

    var action = params.action;
    var result;

    // Token Validation for protected routes
    var user = null;
    if (action !== 'login' && action !== 'register' && action !== 'setup_database') {
        var token = params.token;
        if (!token) {
            result = Utils.createResponse(false, 'Missing token');
        } else {
             // Validate Token (Mock or Real)
             // For now, assuming token is valid if present (or we can parse it if we implemented verify)
             // Utils.verifyToken(token) ...
             // Let's implement a simple user extraction from token (mock)
             try {
                var parts = token.split('.');
                var payload = JSON.parse(Utils.isGas() ? Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString() : Buffer.from(parts[1], 'base64').toString());
                user = payload;
             } catch (e) {
                result = Utils.createResponse(false, 'Invalid token');
             }
        }
    }

    if (!result) {
        switch (action) {
          case 'login':
            result = Auth.login(params.identifier, params.password);
            break;
          case 'register':
            result = Auth.register({
              email: params.email,
              full_name: params.full_name,
              phone: params.phone,
              role: params.role
            });
            break;
          case 'setup_database':
            Database.setupDatabase();
            result = Utils.createResponse(true, 'Database setup complete');
            break;

          // Student Routes
          case 'student_dashboard':
             result = Student.getDashboardData(user.user_id);
             break;
          case 'student_courses':
             result = Student.getEnrolledCourses(user.user_id);
             break;
          case 'student_attendance_submit':
             result = Student.submitAttendance(user.user_id, params.course_id, params.session_date, params.status);
             break;

          default:
            result = Utils.createResponse(false, 'Invalid action');
        }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(Utils.createResponse(false, 'Error: ' + error.toString())))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Function to run manual setup
function manualSetup() {
  Database.setupDatabase();
  Logger.log('Database Setup Complete');
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = {
    doGet: doGet,
    doPost: doPost,
    manualSetup: manualSetup
  };
}
