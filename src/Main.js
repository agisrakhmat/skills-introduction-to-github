// Import dependencies if running in Node.js
if (typeof require !== 'undefined') {
  var Auth = require('./Auth');
  var Courses = require('./Courses'); // Future Integration
  var Grading = require('./Grading'); // Future Integration
}

/**
 * Main Entry Point for Google Apps Script Web App
 */

function doGet(e) {
  var output = {
    status: "success",
    message: "Diploma Ilmi LMS Backend is Running",
    timestamp: new Date()
  };
  return createJSONOutput(output);
}

function doPost(e) {
  var lock = getLockService();

  if (lock.tryLock(10000)) {
    try {
      if (!e || !e.postData) {
        return createJSONOutput({ status: "error", message: "No post data" });
      }

      var data = JSON.parse(e.postData.contents);
      var action = data.action;
      var payload = data.payload;
      var result;

      switch (action) {
        case 'register':
          result = Auth.register(payload);
          break;
        case 'login':
          result = Auth.login(payload.email, payload.password);
          break;

        // --- Academic Routes (Placeholders/Basic Integration) ---
        case 'check_eligibility':
          // Check if student can enroll in a level/course
          // payload: { student_id: "...", level: 2 }
          result = Courses.canEnroll(payload.student_id, payload.level);
          break;

        case 'calculate_grade':
          // Test grading logic
          // payload: { attendance: 100, assignment: 80, uts: 90, uas: 85 }
          var score = Grading.calculateFinalScore(
            payload.attendance, payload.assignment, payload.uts, payload.uas
          );
          var grade = Grading.determineGrade(score);
          result = { success: true, data: grade };
          break;

        default:
          result = { success: false, message: "Unknown action" };
      }

      return createJSONOutput(result);

    } catch (err) {
      return createJSONOutput({ status: "error", message: err.toString() });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJSONOutput({
      status: "error",
      message: "Server is busy. Please try again."
    });
  }
}

function getLockService() {
  if (typeof LockService !== 'undefined') {
    return LockService.getScriptLock();
  } else {
    return { tryLock: function(ms) { return true; }, releaseLock: function() {} };
  }
}

function createJSONOutput(object) {
  if (typeof ContentService !== 'undefined') {
    return ContentService.createTextOutput(JSON.stringify(object))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return JSON.stringify(object);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { doGet, doPost };
}
