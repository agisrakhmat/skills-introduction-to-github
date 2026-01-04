// Entry Point for GAS
// Since we are simulating, we need to ensure the other files are loaded.
// In GAS, all files are in the same scope.
// In Node, we need requires.

if (typeof require !== 'undefined') {
  // Node.js environment simulation
  var { Auth } = require('./Auth');
  var { Grading } = require('./Grading');
  var { CourseService } = require('./CourseService');
  var { Database, SHEET_NAMES } = require('./Database');
}

/**
 * Main GET Handler
 */
function doGet(e) {
  // Basic routing
  const action = e.parameter.action;

  let result = {};

  try {
    switch(action) {
      case 'login':
        result = Auth.login(e.parameter.identifier, e.parameter.password);
        break;
      case 'get_student_data':
        // TODO: Implement getting student dashboard data
        result = getStudentData(e.parameter.student_id);
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main POST Handler
 */
function doPost(e) {
  // Lock service is recommended in spec for concurrency
  // "Concurrency Lock: Wajib pada doPost (pendaftaran/submit)."
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // wait 30 seconds
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Server busy, try again.'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let result = {};
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    switch(action) {
      case 'register':
        result = Auth.registerStudent(params.data);
        break;
      case 'calculate_grade': // Triggered by admin or system?
        result = Grading.calculateGrade(params.enrollment_id);
        break;
      case 'enroll_course':
        result = CourseService.enroll(params.student_id, params.course_id);
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


function getStudentData(studentId) {
  const users = Database.getTable(SHEET_NAMES.USERS);
  const user = users.find(u => u.user_id === studentId);
  if (!user) throw new Error('User not found');

  // Get Enrollments
  const enrollments = Database.getTable(SHEET_NAMES.ENROLLMENTS).filter(e => e.student_id === studentId);

  return {
    success: true,
    data: {
      profile: user,
      enrollments: enrollments
    }
  };
}

// Mock ContentService and LockService for Node testing
if (typeof module !== 'undefined') {
  module.exports = { doGet, doPost };

  // Mocks
  global.ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput: function(content) {
      return {
        setMimeType: function() { return this; },
        getContent: function() { return content; }
      };
    }
  };

  global.LockService = {
    getScriptLock: function() {
      return {
        waitLock: function() {},
        releaseLock: function() {}
      };
    }
  };
}
