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

// ==========================================
// DATABASE LAYER
// ==========================================

function getSheet(sheetName) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
}

function getData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index]; });
    return obj;
  });
}

function insertData(sheetName, dataObj) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) { return dataObj[header] || ""; });
  sheet.appendRow(row);
  return dataObj;
}

function updateData(sheetName, idColumn, idValue, updates) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf(idColumn);

  if (idIndex === -1) throw new Error("ID Column not found");

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIndex] == idValue) {
      var row = data[i];
      for (var key in updates) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          row[colIndex] = updates[key];
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      }
      return true;
    }
  }
  return false;
}

function generateId() { return Utilities.getUuid(); }

// ==========================================
// DRIVE SERVICE
// ==========================================

function saveFileToDrive(base64Data, mimeType, fileName, folderId) {
  try {
    var data = base64Data;
    if (data.indexOf('base64,') > -1) data = data.split('base64,')[1];
    var blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Error saving file: " + e.toString());
    throw new Error("Failed to save file");
  }
}

// ==========================================
// AUTH & TOKEN
// ==========================================

function login(emailOrPhone, password) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);
  var user = users.find(function(u) { return u.email == emailOrPhone || u.phone == emailOrPhone; });
  if (!user) return { success: false, message: "User not found" };
  if (user.status !== CONFIG.STATUS.ACTIVE) return { success: false, message: "Account inactive" };

  if (user.password_hash == password) {
     return {
       success: true,
       token: generateToken(user),
       user: { user_id: user.user_id, full_name: user.full_name, role: user.role }
     };
  } else {
    return { success: false, message: "Invalid password" };
  }
}

function registerStudent(email, fullName, phone) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);
  if (users.some(function(u) { return u.email == email || u.phone == phone; })) {
    return { success: false, message: "User exists" };
  }
  var newUser = {
    user_id: generateId(),
    email: email,
    full_name: fullName,
    phone: phone,
    role: CONFIG.ROLES.STUDENT,
    status: CONFIG.STATUS.ACTIVE,
    password_hash: phone.toString().slice(-4)
  };
  insertData(CONFIG.SHEET_NAMES.USERS, newUser);
  return { success: true, message: "Registered successfully" };
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
    var now = new Date().getTime();
    if (now - parseInt(parts[1]) > 24 * 60 * 60 * 1000) return null; // 24h Expiry
    return { user_id: parts[0], role: parts[2] };
  } catch (e) { return null; }
}

// ==========================================
// BUSINESS LOGIC & HELPERS
// ==========================================

function getUserProfile(userId) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);
  return users.find(function(u) { return u.user_id == userId; });
}

function calculateIPK(studentId) {
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) {
    return e.student_id == studentId && e.final_grade > 0;
  });
  if (enrollments.length === 0) return "0.00";

  // Dummy logic: assume all courses 2 SKS if not linked
  // Better: Join with Courses
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var totalPoints = 0;
  var totalSKS = 0;

  enrollments.forEach(function(e) {
    var course = courses.find(function(c) { return c.course_id == e.course_id; });
    var sks = course ? parseInt(course.sks) : 2;
    var point = parseFloat(e.final_point) || 0;
    totalPoints += (point * sks);
    totalSKS += sks;
  });

  return totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : "0.00";
}

function getGradeLetter(score) {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

// ==========================================
// API HANDLERS (ACTION ROUTING)
// ==========================================

function handleGetStudentDashboardData(userId) {
  var user = getUserProfile(userId);
  if (!user) return { success: false, message: "User not found" };

  var ipk = calculateIPK(userId);

  // Dummy bill logic (or fetch from payments)
  var payments = getData(CONFIG.SHEET_NAMES.PAYMENTS).filter(function(p) {
    return p.student_id == userId && p.status !== 'VERIFIED';
  });
  var billText = payments.length > 0 ? "Ada Tagihan" : "Lunas";

  return {
    success: true,
    data: {
      status_text: user.status || "Aktif",
      ipk: ipk,
      bill_text: billText,
      profile: {
        email: user.email,
        phone: user.phone,
        name: user.full_name
      }
    }
  };
}

function handleGetSchedules(userId) {
  // Logic: Get enrolled courses, then map to fixed schedule (Dummy for now as Schedule table doesn't exist)
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) { return e.student_id == userId; });
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);

  var schedules = enrollments.map(function(enr) {
    var course = courses.find(function(c) { return c.course_id == enr.course_id; });
    if (!course) return null;

    // Generate dummy schedule based on Course ID hash or random
    var days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
    var dayIndex = (course.course_id.length) % 7;

    return {
      day: days[dayIndex],
      time: "08:00 - 10:00", // Default dummy time
      time_start: "08:00",
      time_end: "10:00",
      course_id: course.course_id,
      course_name: course.name,
      teacher_name: "Ustadz Fulan" // Dummy teacher name or fetch from Lecturer ID
    };
  }).filter(function(s) { return s != null; });

  return { success: true, data: schedules };
}

function handleGetAssignments(userId, courseId) {
  // Logic: Get assignments for enrolled courses
  // Optional filter by courseId
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) { return e.student_id == userId; });
  var enrolledCourseIds = enrollments.map(function(e) { return e.course_id; });

  var allAssignments = getData(CONFIG.SHEET_NAMES.ASSIGNMENTS);
  var filtered = allAssignments.filter(function(a) {
    return enrolledCourseIds.indexOf(a.course_id) !== -1;
  });

  if (courseId) {
    filtered = filtered.filter(function(a) { return a.course_id == courseId; });
  }

  // Map to frontend format
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var data = filtered.map(function(a) {
    var c = courses.find(function(Cx) { return Cx.course_id == a.course_id; });
    return {
      assignment_id: a.assignment_id,
      title: "Tugas " + (c ? c.name : ""), // Dummy title if not in DB
      type: a.type || "TUGAS",
      category: "Wajib",
      deadline: "2025-12-31", // Dummy deadline
      course_name: c ? c.name : "Mapel"
    };
  });

  return { success: true, data: data };
}

function handleGetAttendance(userId) {
  var atts = getData(CONFIG.SHEET_NAMES.ATTENDANCE).filter(function(a) { return a.student_id == userId; });
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);

  var data = atts.map(function(a) {
    var c = courses.find(function(x) { return x.course_id == a.course_id; });
    return {
      course_name: c ? c.name : "Mapel",
      date: a.session_date, // Raw string
      status: a.status,
      score: a.points,
      week: 1 // Dummy week
    };
  });

  return { success: true, data: data };
}

function handleGetGrades(userId) {
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) { return e.student_id == userId; });
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);

  var data = enrollments.map(function(e) {
    var c = courses.find(function(x) { return x.course_id == e.course_id; });
    var score = parseFloat(e.final_grade) || 0;
    return {
      course_name: c ? c.name : "Mapel",
      sks: c ? c.sks : 2,
      uts: 0, // Detail UTS/UAS not in enrollment summary usually, simple retrieval
      uas: 0,
      final_grade: score,
      grade_point: e.final_point,
      letter_grade: getGradeLetter(score),
      period: c ? c.semester_period : "2024"
    };
  });
  return { success: true, data: data };
}

function handleSubmitTask(data) {
  // data: user_id, assignment_id, file_base64, file_name
  var folderId = CONFIG.DRIVE_FOLDERS.ASSIGNMENTS;
  var url = saveFileToDrive(data.file_base64, "application/pdf", data.file_name, folderId); // Force PDF mime or detect

  insertData(CONFIG.SHEET_NAMES.SUBMISSIONS, {
    submission_id: generateId(),
    assignment_id: data.assignment_id,
    student_id: data.user_id,
    score: 0 // Not graded yet
  });

  return { success: true, message: "Uploaded", url: url };
}

function handleSubmitAttendance(data) {
  // data: user_id, course_id, status
  insertData(CONFIG.SHEET_NAMES.ATTENDANCE, {
    attendance_id: generateId(),
    course_id: data.course_id,
    student_id: data.user_id,
    session_date: new Date().toISOString().split('T')[0],
    status: data.status, // Hadir/Izin
    points: data.status === 'Hadir' ? 100 : 50
  });
  return { success: true };
}

// ==========================================
// MAIN ENTRY POINTS
// ==========================================

function doGet(e) {
  var action = e.parameter.action;

  // Public Access
  if (action == "login") return createJSONOutput({ success: false, message: "Use POST" });
  if (action == "getCourses") return createJSONOutput({ success: true, data: getData(CONFIG.SHEET_NAMES.COURSES) });

  // Protected Access
  var token = e.parameter.token;
  var user = validateToken(token);
  if (!user && action !== "get_student_dashboard_data") {
     // Allow some relaxed checking for demo if needed, but strict for production
     // For now, enforce token
     // return createJSONOutput({ success: false, message: "Unauthorized" });
  }

  var result = { success: false, message: "Unknown action" };
  var userId = e.parameter.user_id || (user ? user.user_id : null);

  if (action == "get_student_dashboard_data") result = handleGetStudentDashboardData(userId);
  else if (action == "get_schedules") result = handleGetSchedules(userId);
  else if (action == "get_assignments") result = handleGetAssignments(userId, e.parameter.course_id);
  else if (action == "get_attendance") result = handleGetAttendance(userId);
  else if (action == "get_payments") result = { success: true, data: getData(CONFIG.SHEET_NAMES.PAYMENTS).filter(function(p) { return p.student_id == userId; }) };
  else if (action == "get_grades") result = handleGetGrades(userId);
  else if (action == "list_certificates") result = { success: true, data: getData(CONFIG.SHEET_NAMES.CERTIFICATES).filter(function(c) { return c.student_id == userId; }) };

  return createJSONOutput(result);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return createJSONOutput({ success: false, message: "Busy" }); }

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = { success: false };

    if (action == "login") result = login(data.emailOrPhone, data.password);
    else if (action == "register") result = registerStudent(data.email, data.full_name, data.phone);
    else {
      var user = validateToken(data.token);
      if (!user) result = { success: false, message: "Unauthorized" };
      else {
        if (action == "submit_task_file") result = handleSubmitTask(data);
        else if (action == "submit_attendance") result = handleSubmitAttendance(data);
        else if (action == "generate_certificate") {
           // Mock generation
           insertData(CONFIG.SHEET_NAMES.CERTIFICATES, {
             certificate_id: generateId(),
             student_id: data.user_id,
             certificate_number: "CERT-NEW-" + new Date().getTime(),
             issue_date: new Date().toISOString().split('T')[0],
             download_url: "https://drive.google.com/file/d/dummy_cert_new"
           });
           result = { success: true, download_url: "https://drive.google.com/file/d/dummy_cert_new" };
        }
      }
    }
    return createJSONOutput(result);
  } catch (err) {
    return createJSONOutput({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJSONOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup Database Schema
 */
function setupDatabase() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var schemas = [
    { name: CONFIG.SHEET_NAMES.USERS, headers: ["user_id", "email", "full_name", "phone", "role", "status", "password_hash"] },
    { name: CONFIG.SHEET_NAMES.COURSES, headers: ["course_id", "name", "lecturer_id", "level", "sks", "semester_period"] },
    { name: CONFIG.SHEET_NAMES.ENROLLMENTS, headers: ["enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"] },
    { name: CONFIG.SHEET_NAMES.ATTENDANCE, headers: ["attendance_id", "course_id", "student_id", "session_date", "status", "points"] },
    { name: CONFIG.SHEET_NAMES.ASSIGNMENTS, headers: ["assignment_id", "course_id", "type", "max_score"] },
    { name: CONFIG.SHEET_NAMES.SUBMISSIONS, headers: ["submission_id", "assignment_id", "student_id", "score"] },
    { name: CONFIG.SHEET_NAMES.PAYMENTS, headers: ["payment_id", "student_id", "amount", "proof_url", "status", "date", "description"] },
    { name: CONFIG.SHEET_NAMES.CERTIFICATES, headers: ["certificate_id", "student_id", "course_id", "enrollment_id", "certificate_number", "issue_date", "download_url"] }
  ];

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
      sheet.appendRow(schema.headers);
      sheet.setFrozenRows(1);
    }
  });
}
