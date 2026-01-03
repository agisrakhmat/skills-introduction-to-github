/**
 * Diploma Ilmi LMS Backend
 * Version: 3.1
 */

function doGet(e) {
  return HtmlService.createHtmlOutput('Diploma Ilmi LMS Backend is running. Access via POST requests.');
}

function doPost(e) {
  // Concurrency Lock as per specification
  var lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return Utils.createErrorResponse('Invalid request', 400);
    }

    var params;
    try {
      params = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return Utils.createErrorResponse('Invalid JSON payload', 400);
    }

    var action = params.action;

    if (!action) {
      return Utils.createErrorResponse('Action not specified', 400);
    }

    // Routing Logic
    switch (action) {
      // Auth
      case 'login':
        return Auth.login(params);
      case 'register':
        return Auth.register(params);

      // Student Features
      case 'get_student_dashboard':
        var user = Auth.verifyToken(params.token);
        if (!user) return Utils.createErrorResponse('Unauthorized or Token Expired', 401);
        return Student.getDashboardData(user.sub);

      case 'enroll_course':
        var user = Auth.verifyToken(params.token);
        if (!user) return Utils.createErrorResponse('Unauthorized or Token Expired', 401);
        return Enrollments.enroll(user.sub, params.course_id);

      case 'submit_attendance':
        var user = Auth.verifyToken(params.token);
        if (!user) return Utils.createErrorResponse('Unauthorized or Token Expired', 401);
        params.student_id = user.sub; // Force use of authenticated ID
        return Student.submitAttendance(params);

      // System
      case 'setup_database':
        return DatabaseSetup.run();

      default:
        return Utils.createErrorResponse('Unknown action: ' + action, 404);
    }

  } catch (err) {
    return Utils.createErrorResponse('Internal Server Error: ' + err.toString(), 500);
  } finally {
    lock.releaseLock();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doGet: doGet,
    doPost: doPost
  };
}
