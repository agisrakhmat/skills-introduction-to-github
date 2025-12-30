/**
 * Code.gs
 * Main entry point and router for the GAS backend.
 */

// Global Lock for concurrency
var LOCK_WAIT_MS = 30000;

/**
 * Serves the Frontend via HtmlService.
 * By default, serves the Login page.
 * Uses query parameter ?page=dashboard to switch.
 */
function doGet(e) {
  var page = e.parameter.page || 'login';
  var templateName = 'Login_Student'; // Default

  if (page === 'dashboard') {
      templateName = 'Dashboard_Student';
  }
  // Add more pages as needed

  // Check if file exists in project (GAS usually maps html files by name)
  // For local repo structure, files are in frontend/, but in GAS they are just files.
  // We assume the build process or copy-paste puts them in the script project.

  try {
      // In local dev simulation, we can't really "serve" HTML dynamically easily
      // without a complex build step, but this code is for the GAS environment.
      return HtmlService.createTemplateFromFile(templateName)
          .evaluate()
          .setTitle('Diploma Ilmi LMS')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Allow embedding in Elementor
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
      return ContentService.createTextOutput("Page not found: " + templateName);
  }
}

/**
 * Handles external POST requests (e.g., from Postman or external apps).
 * Returns JSON.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);

    var params = e.parameter || {};
    var action = params.action;

    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = params;
      }
    } else {
        payload = params;
    }

    // Use the internal router
    var result = router(action, payload);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Dedicated Handler for google.script.run (Client-side JS).
 * Returns native JS Objects (not ContentService).
 */
function apiHandler(payload) {
    var lock = LockService.getScriptLock();
    // Only lock for write operations to improve performance
    var action = payload.action || '';
    var needsLock = ['register', 'enroll_course', 'submit_assignment'].indexOf(action) !== -1;

    try {
        if (needsLock) lock.waitLock(LOCK_WAIT_MS);

        // Call internal router
        return router(action, payload);

    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        if (needsLock) lock.releaseLock();
    }
}

/**
 * Central Router Logic.
 * Returns JS Object { status, data, message }.
 */
function router(action, payload) {
  if (action === 'login') {
    return AuthController.login(payload);
  }
  if (action === 'register') {
    return AuthController.register(payload);
  }

  // Auth Middleware
  var currentUser = AuthController.validateToken(payload.token);
  if (!currentUser) {
      return { status: 'error', message: 'Unauthorized: Invalid or expired token' };
  }

  switch (action) {
    // --- Student Actions ---
    case 'get_dashboard_data':
        // IDOR Check: Ensure user is requesting their own data, or is Admin/Academic
        if (currentUser.role === 'STUDENT' && currentUser.user_id !== payload.user_id) {
            return { status: 'error', message: 'Unauthorized access to other student data' };
        }
        return AcademicController.getStudentDashboard(payload.user_id);

    case 'enroll_course':
        if (currentUser.role === 'STUDENT' && currentUser.user_id !== payload.student_id) {
             return { status: 'error', message: 'Unauthorized enrollment attempt' };
        }
        return AcademicController.enrollCourse(payload.student_id, payload.course_id);

    case 'get_profile':
        if (currentUser.role === 'STUDENT' && currentUser.user_id !== payload.user_id) {
            return { status: 'error', message: 'Unauthorized' };
        }
        return AuthController.getUserProfile(payload.user_id);

    // --- Academic Actions (Lecturer/Admin) ---
    case 'submit_grade':
        if (currentUser.role !== 'LECTURER' && currentUser.role !== 'ADMIN') {
            return { status: 'error', message: 'Forbidden: Lecturer access required' };
        }
        return AcademicController.submitGrade(currentUser.user_id, payload.course_id, payload.student_id, payload.type, payload.score);

    case 'update_attendance':
        if (currentUser.role !== 'LECTURER' && currentUser.role !== 'ADMIN') {
            return { status: 'error', message: 'Forbidden: Lecturer access required' };
        }
        return AcademicController.updateAttendance(currentUser.user_id, payload.course_id, payload.student_id, payload.session_date, payload.status);

    // --- Finance Actions ---
    case 'verify_payment':
         if (currentUser.role !== 'FINANCE' && currentUser.role !== 'ADMIN') {
            return { status: 'error', message: 'Forbidden: Finance access required' };
        }
        return FinanceController.verifyPayment(currentUser.user_id, payload.payment_id, payload.status);

    // --- Admin Actions ---
    case 'admin_reset_password':
        if (currentUser.role !== 'ADMIN') {
             return { status: 'error', message: 'Forbidden: Admin access required' };
        }
        return AdminController.resetPassword(currentUser.user_id, payload.target_user_id, payload.new_password);

    case 'generate_certificate':
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ACADEMIC') {
             return { status: 'error', message: 'Forbidden: Admin/Academic access required' };
        }
        return AdminController.generateCertificate(currentUser.user_id, payload.enrollment_id);

    case 'test_connection':
      return { status: 'success', message: 'Backend is reachable' };

    default:
      return { status: 'error', message: 'Unknown action: ' + action };
  }
}

// Stub for AuthController/AcademicController if running locally
if (typeof AuthController === 'undefined') var AuthController = {};
if (typeof AcademicController === 'undefined') var AcademicController = {};
if (typeof AdminController === 'undefined') var AdminController = {};
if (typeof FinanceController === 'undefined') var FinanceController = {};
