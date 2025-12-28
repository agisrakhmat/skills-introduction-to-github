// src/Code.gs

/**
 * Entry point for HTTP GET requests
 */
function doGet(e) {
  var action = e.parameter.action;

  if (action == "login") {
     return createJSONOutput({ success: false, message: "Login must be POST" });
  } else if (action == "getCourses") {
     var courses = getData(CONFIG.SHEET_NAMES.COURSES);
     return createJSONOutput({ success: true, data: courses });
  } else if (action == "getProfile") {
     // Validate Token for security
     var token = e.parameter.token;
     var user = validateToken(token);
     if (!user) {
        return createJSONOutput({ success: false, message: "Unauthorized" });
     }

     var studentId = e.parameter.student_id;
     // Access Control: Can only view own profile unless Admin/Staff
     if (user.role === CONFIG.ROLES.STUDENT && user.user_id !== studentId) {
        return createJSONOutput({ success: false, message: "Forbidden" });
     }

     var users = getData(CONFIG.SHEET_NAMES.USERS);
     var profile = users.find(function(u) { return u.user_id == studentId; });
     // Don't return password hash
     if (profile) delete profile.password_hash;

     return createJSONOutput({ success: true, data: profile });
  }

  return HtmlService.createHtmlOutput("<h1>Diploma Ilmi LMS Backend</h1>");
}

/**
 * Entry point for HTTP POST requests
 */
function doPost(e) {
  // Concurrency Lock
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds
  } catch (e) {
    return createJSONOutput({ success: false, message: "Server is busy, try again." });
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = { success: false, message: "Unknown action" };

    // Public Actions
    if (action == "login") {
      result = login(data.emailOrPhone, data.password);
    } else if (action == "register") {
      result = registerStudent(data.email, data.full_name, data.phone);
    }
    // Protected Actions
    else {
      var token = data.token;
      var user = validateToken(token);

      if (!user) {
        result = { success: false, message: "Unauthorized: Invalid or missing token" };
      } else {
        if (action == "enroll") {
          // Role Check: Only Student can enroll themselves, or Admin/Academic
          if (user.role === CONFIG.ROLES.STUDENT && user.user_id !== data.student_id) {
             result = { success: false, message: "Forbidden: You cannot enroll others" };
          } else {
             result = enrollStudent(data.student_id, data.course_id);
          }
        } else if (action == "submitAssignment") {
          // Implementation for submitting assignment
          if (user.role !== CONFIG.ROLES.STUDENT) {
             result = { success: false, message: "Only students can submit assignments" };
          } else {
             // ... Logic to save submission ...
             result = { success: true, message: "Submission functionality not fully implemented in this demo" };
          }
        } else if (action == "calculateGrade") {
          // Role Check: Admin, Academic, Lecturer, or System
          var allowedRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.ACADEMIC, CONFIG.ROLES.LECTURER];
          if (allowedRoles.indexOf(user.role) === -1) {
             result = { success: false, message: "Forbidden: Insufficient permissions" };
          } else {
             result = calculateGrade(data.enrollment_id);
          }
        }
      }
    }

    return createJSONOutput(result);

  } catch (error) {
    return createJSONOutput({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJSONOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
