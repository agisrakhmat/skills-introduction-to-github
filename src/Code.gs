// src/Code.gs

/**
 * Configuration for Diploma Ilmi LMS
 */

var CONFIG = {
  // Spreadsheet ID provided by user
  SPREADSHEET_ID: "1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA",

  SHEET_NAMES: {
    USERS: "USERS",
    COURSES: "COURSES",
    ENROLLMENTS: "ENROLLMENTS",
    ATTENDANCE: "ATTENDANCE",
    ASSIGNMENTS: "ASSIGNMENTS",
    SUBMISSIONS: "SUBMISSIONS",
    PAYMENTS: "PAYMENTS",
    CERTIFICATES: "CERTIFICATES"
  },

  ROLES: {
    STUDENT: "STUDENT",
    LECTURER: "LECTURER",
    FINANCE: "FINANCE",
    ADMIN: "ADMIN",
    ACADEMIC: "ACADEMIC"
  },

  STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  },

  PASSING_GRADE: 3.0,

  WEIGHTS: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  ATTENDANCE_SCORES: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  },

  DRIVE_FOLDERS: {
    CERTIFICATES: "1XAgam8EcNiaAiKKi4c5aksgTG2y5_OEk",
    ASSIGNMENTS: "1J8tS_z-vxmrRM6H9ajDXGdbDs7kFxYNS",
    PAYMENT_PROOFS: "1f290UerP4m7hZ4orznTzpD26GLGPM0kg",
    PAYMENT_RECEIPTS: "1T5LmOfnHnt4TeFzfFrl8zLKocGeg0s57",
    TRANSCRIPTS: "1dXdoJrVwJ7AXCVzF76-fQkhyo8fL8I7C",
    REGISTRATION_ATTACHMENTS: "1fb3tirvtPD-M0HvYI_Rdb0dT7A9eX_yq"
  }
};

// Database Layer

/**
 * Helper to get a Sheet object
 */
function getSheet(sheetName) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
}

/**
 * Reads all data from a sheet as an array of objects.
 * Keys are taken from the header row.
 */
function getData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Appends a new row to a sheet.
 * @param {string} sheetName
 * @param {Object} dataObj - Object with keys matching sheet headers
 */
function insertData(sheetName, dataObj) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var row = headers.map(function(header) {
    return dataObj[header] || "";
  });

  sheet.appendRow(row);
  return dataObj;
}

/**
 * Updates a row based on a unique ID (first column usually, or specified).
 */
function updateData(sheetName, idColumn, idValue, updates) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf(idColumn);

  if (idIndex === -1) throw new Error("ID Column not found");

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIndex] == idValue) {
      // Found the row
      var row = data[i];
      for (var key in updates) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          row[colIndex] = updates[key];
          // Update the cell directly
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * Generates a unique ID
 */
function generateId() {
  return Utilities.getUuid();
}

// Drive Service Layer

/**
 * Saves a base64 encoded file to a specific Google Drive folder.
 */
function saveFileToDrive(base64Data, mimeType, fileName, folderId) {
  try {
    // Handle data URI scheme if present
    var data = base64Data;
    if (data.indexOf('base64,') > -1) {
      data = data.split('base64,')[1];
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (e) {
    Logger.log("Error saving file to drive: " + e.toString());
    throw new Error("Failed to save file: " + e.toString());
  }
}

// Auth Layer

/**
 * Handles user authentication
 */
function login(emailOrPhone, password) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);

  var user = users.find(function(u) {
    return u.email == emailOrPhone || u.phone == emailOrPhone;
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.status !== CONFIG.STATUS.ACTIVE) {
    return { success: false, message: "Account is inactive" };
  }

  if (user.password_hash == password) {
     return {
       success: true,
       token: generateToken(user),
       user: {
         user_id: user.user_id,
         full_name: user.full_name,
         role: user.role
       }
     };
  } else {
    return { success: false, message: "Invalid password" };
  }
}

function registerStudent(email, fullName, phone) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);

  var exists = users.some(function(u) {
    return u.email == email || u.phone == phone;
  });

  if (exists) {
    return { success: false, message: "User already exists" };
  }

  var rawPassword = phone.toString().slice(-4);
  var passwordHash = rawPassword;

  var newUser = {
    user_id: generateId(),
    email: email,
    full_name: fullName,
    phone: phone,
    role: CONFIG.ROLES.STUDENT,
    status: CONFIG.STATUS.ACTIVE,
    password_hash: passwordHash
  };

  insertData(CONFIG.SHEET_NAMES.USERS, newUser);

  return { success: true, message: "Registration successful. Password is last 4 digits of phone." };
}

function generateToken(user) {
  var raw = user.user_id + ":" + new Date().getTime() + ":" + user.role;
  return Utilities.base64Encode(raw);
}

function validateToken(token) {
  if (!token) return null;

  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var parts = decoded.split(":");
    if (parts.length !== 3) return null;

    var userId = parts[0];
    var timestamp = parts[1];
    var role = parts[2];

    var now = new Date().getTime();
    if (now - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
       return null; // Expired
    }

    return {
      user_id: userId,
      role: role
    };

  } catch (e) {
    return null;
  }
}

// Business Logic Layer

/**
 * Calculates the Final Score and Status for an enrollment
 */
function calculateGrade(enrollmentId) {
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var enrollment = enrollments.find(function(e) { return e.enrollment_id == enrollmentId; });

  if (!enrollment) return { error: "Enrollment not found" };

  var courseId = enrollment.course_id;
  var studentId = enrollment.student_id;

  // 1. Calculate Attendance Score
  var attendanceRecords = getData(CONFIG.SHEET_NAMES.ATTENDANCE).filter(function(a) {
    return a.course_id == courseId && a.student_id == studentId;
  });

  var totalAttendancePoints = 0;

  if (attendanceRecords.length > 0) {
    attendanceRecords.forEach(function(r) {
      var points = 0;
      if (r.status === "HADIR") points = CONFIG.ATTENDANCE_SCORES.HADIR;
      else if (r.status === "REKAMAN") points = CONFIG.ATTENDANCE_SCORES.REKAMAN;
      else if (r.status === "IZIN") points = CONFIG.ATTENDANCE_SCORES.IZIN;
      else if (r.status === "ALPA") points = CONFIG.ATTENDANCE_SCORES.ALPA;

      totalAttendancePoints += points;
    });
    // Average attendance score 0-100
    var attendanceScore = totalAttendancePoints / attendanceRecords.length;
  } else {
    var attendanceScore = 0;
  }

  // 2. Calculate Assignment, UTS, UAS Scores
  var submissions = getData(CONFIG.SHEET_NAMES.SUBMISSIONS).filter(function(s) {
    return s.student_id == studentId;
  });

  var assignments = getData(CONFIG.SHEET_NAMES.ASSIGNMENTS).filter(function(a) {
    return a.course_id == courseId;
  });

  var taskScore = 0, taskCount = 0;
  var utsScore = 0;
  var uasScore = 0;

  assignments.forEach(function(assignment) {
    // Find submission
    var sub = submissions.find(function(s) { return s.assignment_id == assignment.assignment_id; });
    var score = sub ? sub.score : 0;

    var max = assignment.max_score || 100;
    var normalizedScore = (score / max) * 100;

    if (assignment.type === "TUGAS") {
      taskScore += normalizedScore;
      taskCount++;
    } else if (assignment.type === "UTS") {
      utsScore = normalizedScore;
    } else if (assignment.type === "UAS") {
      uasScore = normalizedScore;
    }
  });

  var finalTaskScore = taskCount > 0 ? (taskScore / taskCount) : 0;

  // 3. Apply Formula
  var finalScore = (attendanceScore * CONFIG.WEIGHTS.ATTENDANCE) +
                   (finalTaskScore * CONFIG.WEIGHTS.ASSIGNMENT) +
                   (utsScore * CONFIG.WEIGHTS.UTS) +
                   (uasScore * CONFIG.WEIGHTS.UAS);

  // 4. Convert to Point and Status
  var finalPoint = 0.0;
  var status = "FAILED";

  if (finalScore >= 90) {
    finalPoint = 4.0;
    status = "PASSED";
  } else if (finalScore >= 80) {
    finalPoint = 3.0;
    status = "PASSED";
  } else {
    finalPoint = 0.0;
    status = "FAILED";
  }

  updateData(CONFIG.SHEET_NAMES.ENROLLMENTS, "enrollment_id", enrollmentId, {
    final_grade: finalScore,
    final_point: finalPoint,
    status: status
  });

  return {
    enrollment_id: enrollmentId,
    final_grade: finalScore,
    final_point: finalPoint,
    status: status
  };
}

/**
 * Checks if a student can enroll in a specific course (Mustawa Logic)
 */
function canEnroll(studentId, courseId) {
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var targetCourse = courses.find(function(c) { return c.course_id == courseId; });

  if (!targetCourse) return { allowed: false, reason: "Course not found" };

  var targetLevel = targetCourse.level;

  // 1. Single Level Policy
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var activeEnrollments = enrollments.filter(function(e) {
    return e.student_id == studentId && e.status === "ENROLLED";
  });

  var activeLevels = [];
  activeEnrollments.forEach(function(e) {
    var c = courses.find(function(cx) { return cx.course_id == e.course_id; });
    if (c && activeLevels.indexOf(c.level) === -1) {
      activeLevels.push(c.level);
    }
  });

  if (activeLevels.length > 0) {
    if (activeLevels[0] !== targetLevel) {
       return { allowed: false, reason: "Single Level Policy: You have active courses in Level " + activeLevels[0] };
    }
  }

  // 2. Sequential Progression
  if (targetLevel > 1) {
    var previousLevel = targetLevel - 1;
    var prevLevelCourses = courses.filter(function(c) { return c.level == previousLevel; });
    var studentHistory = enrollments.filter(function(e) { return e.student_id == studentId; });

    var allPassed = prevLevelCourses.every(function(course) {
      var hasPassed = studentHistory.some(function(h) {
        return h.course_id == course.course_id && h.status === "PASSED" && h.final_point >= CONFIG.PASSING_GRADE;
      });
      return hasPassed;
    });

    if (!allPassed) {
      return { allowed: false, reason: "Sequential Progression: You must pass all courses in Level " + previousLevel };
    }
  }

  return { allowed: true };
}

function enrollStudent(studentId, courseId) {
  var check = canEnroll(studentId, courseId);
  if (!check.allowed) {
    return { success: false, message: check.reason };
  }

  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS);
  var exists = enrollments.find(function(e) {
    return e.student_id == studentId && e.course_id == courseId && e.status == "ENROLLED";
  });

  if (exists) {
     return { success: false, message: "Already enrolled" };
  }

  insertData(CONFIG.SHEET_NAMES.ENROLLMENTS, {
    enrollment_id: generateId(),
    student_id: studentId,
    course_id: courseId,
    final_grade: 0,
    final_point: 0,
    status: "ENROLLED"
  });

  return { success: true, message: "Enrolled successfully" };
}

// Setup Layer

/**
 * Run this function once to set up your Google Sheet Database.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  var schemas = [
    {
      name: CONFIG.SHEET_NAMES.USERS,
      headers: ["user_id", "email", "full_name", "phone", "role", "status", "password_hash"]
    },
    {
      name: CONFIG.SHEET_NAMES.COURSES,
      headers: ["course_id", "name", "lecturer_id", "level", "sks", "semester_period"]
    },
    {
      name: CONFIG.SHEET_NAMES.ENROLLMENTS,
      headers: ["enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"]
    },
    {
      name: CONFIG.SHEET_NAMES.ATTENDANCE,
      headers: ["attendance_id", "course_id", "student_id", "session_date", "status", "points"]
    },
    {
      name: CONFIG.SHEET_NAMES.ASSIGNMENTS,
      headers: ["assignment_id", "course_id", "type", "max_score"]
    },
    {
      name: CONFIG.SHEET_NAMES.SUBMISSIONS,
      headers: ["submission_id", "assignment_id", "student_id", "score"]
    },
    {
      name: CONFIG.SHEET_NAMES.PAYMENTS,
      headers: ["payment_id", "student_id", "amount", "proof_url", "status"]
    },
    {
      name: CONFIG.SHEET_NAMES.CERTIFICATES,
      headers: ["certificate_id", "student_id", "course_id", "enrollment_id", "certificate_number", "issue_date", "download_url"]
    }
  ];

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
      sheet.appendRow(schema.headers);
      sheet.setFrozenRows(1);
      Logger.log("Created sheet: " + schema.name);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(schema.headers);
        sheet.setFrozenRows(1);
        Logger.log("Added headers to existing sheet: " + schema.name);
      } else {
        Logger.log("Sheet already exists: " + schema.name);
      }
    }
  });

  Logger.log("Database setup complete.");
}

// API Entry Layer (Code.gs)

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
     var token = e.parameter.token;
     var user = validateToken(token);
     if (!user) {
        return createJSONOutput({ success: false, message: "Unauthorized" });
     }

     var studentId = e.parameter.student_id;
     if (user.role === CONFIG.ROLES.STUDENT && user.user_id !== studentId) {
        return createJSONOutput({ success: false, message: "Forbidden" });
     }

     var users = getData(CONFIG.SHEET_NAMES.USERS);
     var profile = users.find(function(u) { return u.user_id == studentId; });
     if (profile) delete profile.password_hash;

     return createJSONOutput({ success: true, data: profile });
  }

  return HtmlService.createHtmlOutput("<h1>Diploma Ilmi LMS Backend</h1>");
}

/**
 * Entry point for HTTP POST requests
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return createJSONOutput({ success: false, message: "Server is busy, try again." });
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = { success: false, message: "Unknown action" };

    if (action == "login") {
      result = login(data.emailOrPhone, data.password);
    } else if (action == "register") {
      result = registerStudent(data.email, data.full_name, data.phone);
    }
    else {
      var token = data.token;
      var user = validateToken(token);

      if (!user) {
        result = { success: false, message: "Unauthorized: Invalid or missing token" };
      } else {
        if (action == "enroll") {
          if (user.role === CONFIG.ROLES.STUDENT && user.user_id !== data.student_id) {
             result = { success: false, message: "Forbidden: You cannot enroll others" };
          } else {
             result = enrollStudent(data.student_id, data.course_id);
          }
        } else if (action == "submitAssignment") {
          if (user.role !== CONFIG.ROLES.STUDENT) {
             result = { success: false, message: "Only students can submit assignments" };
          } else {
             result = { success: true, message: "Submission functionality not fully implemented in this demo" };
          }
        } else if (action == "calculateGrade") {
          var allowedRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.ACADEMIC, CONFIG.ROLES.LECTURER];
          if (allowedRoles.indexOf(user.role) === -1) {
             result = { success: false, message: "Forbidden: Insufficient permissions" };
          } else {
             result = calculateGrade(data.enrollment_id);
          }
        } else if (action == "uploadFile") {
          var folderId = "";

          if (data.type === "PAYMENT_PROOF") folderId = CONFIG.DRIVE_FOLDERS.PAYMENT_PROOFS;
          else if (data.type === "ASSIGNMENT") folderId = CONFIG.DRIVE_FOLDERS.ASSIGNMENTS;
          else if (data.type === "REGISTRATION") folderId = CONFIG.DRIVE_FOLDERS.REGISTRATION_ATTACHMENTS;
          else {
             return createJSONOutput({ success: false, message: "Invalid file type" });
          }

          var url = saveFileToDrive(data.fileData, data.mimeType, data.fileName, folderId);
          result = { success: true, url: url };
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
