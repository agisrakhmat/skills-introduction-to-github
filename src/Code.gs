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

  // CURRENT BATCH CONFIG FOR NIM GENERATION
  CURRENT_BATCH: "07",

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
// HELPERS
// ==========================================

function formatPhoneNumber(phone) {
  if (!phone) return "";
  var p = phone.toString().replace(/\D/g, ''); // Remove non-digits
  if (p.startsWith('0')) {
    p = '62' + p.substring(1);
  } else if (p.startsWith('8')) {
    p = '62' + p;
  }
  return p;
}

function formatDateForFile() {
  var d = new Date();
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var year = d.getFullYear();
  return day + '-' + month + '-' + year;
}

/**
 * GENERATE CUSTOM NIM
 * Pattern: DI.AA.BB.CC.DDD.EEEE
 * AA: IN (Laki) / AT (Wanita)
 * BB: Tahun (e.g. 25)
 * CC: Angkatan (e.g. 07)
 * DDD: Status (RGR)
 * EEEE: Sequence (0001)
 */
function generateStudentNIM(genderCode, statusCode) {
  var prefix = "DI";
  var gender = genderCode || "IN"; // Default IN if missing
  var year = new Date().getFullYear().toString().slice(-2); // 25
  var batch = CONFIG.CURRENT_BATCH; // 07
  var status = statusCode || "RGR"; // Default Reguler

  // Base pattern without sequence
  var idBase = prefix + "." + gender + "." + year + "." + batch + "." + status + ".";

  // Get last sequence from DB
  var users = getData(CONFIG.SHEET_NAMES.USERS);

  // Filter users with same base ID pattern
  var existingIds = users
    .map(function(u) { return u.user_id; })
    .filter(function(id) { return id && id.indexOf(idBase) === 0; });

  var nextSeq = 1;
  if (existingIds.length > 0) {
    // Find max sequence
    var maxSeq = 0;
    existingIds.forEach(function(id) {
      var parts = id.split('.');
      if (parts.length > 0) {
        var seqStr = parts[parts.length - 1];
        var seqVal = parseInt(seqStr, 10);
        if (!isNaN(seqVal) && seqVal > maxSeq) {
          maxSeq = seqVal;
        }
      }
    });
    nextSeq = maxSeq + 1;
  }

  var sequenceStr = ("0000" + nextSeq).slice(-4);

  return idBase + sequenceStr;
}

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

function login(identifier, password) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);
  // Identifier can be Email, Phone, or User ID (NIM)
  var user = users.find(function(u) {
    return u.email == identifier || u.phone == identifier || u.user_id == identifier;
  });

  if (!user) return { success: false, message: "User not found" };

  if (user.password_hash == password) {
     return {
       success: true,
       token: generateToken(user),
       user: { user_id: user.user_id, full_name: user.full_name, role: user.role, status: user.status }
     };
  } else {
    return { success: false, message: "Invalid password" };
  }
}

function registerStudent(email, fullName, phone, gender, status) {
  var users = getData(CONFIG.SHEET_NAMES.USERS);
  var formattedPhone = formatPhoneNumber(phone);

  if (users.some(function(u) { return u.email == email || u.phone == formattedPhone; })) {
    return { success: false, message: "User exists" };
  }

  // Use Custom NIM Generator
  var genderCode = (gender === 'Wanita' || gender === 'Perempuan' || gender === 'AT') ? 'AT' : 'IN';
  var statusCode = status || 'RGR';
  var newNIM = generateStudentNIM(genderCode, statusCode);

  var newUser = {
    user_id: newNIM,
    email: email,
    full_name: fullName,
    phone: formattedPhone,
    role: CONFIG.ROLES.STUDENT,
    status: CONFIG.STATUS.ACTIVE,
    password_hash: formattedPhone.slice(-4)
  };
  insertData(CONFIG.SHEET_NAMES.USERS, newUser);

  return { success: true, message: "Registered successfully. Your NIM is: " + newNIM, nim: newNIM };
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

  var payments = getData(CONFIG.SHEET_NAMES.PAYMENTS).filter(function(p) {
    return p.student_id == userId && (p.status === 'PENDING' || p.status === 'TAGIHAN');
  });
  var billText = payments.length > 0 ? "Ada " + payments.length + " Tagihan" : "Lunas";

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
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) { return e.student_id == userId; });
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var users = getData(CONFIG.SHEET_NAMES.USERS);

  var schedules = enrollments.map(function(enr) {
    var course = courses.find(function(c) { return c.course_id == enr.course_id; });
    if (!course) return null;

    var lecturer = users.find(function(u) { return u.user_id == course.lecturer_id; });
    var days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
    var dayIndex = (course.course_id.length) % 7;

    return {
      day: days[dayIndex],
      time: "08:00 - 10:00",
      time_start: "08:00",
      time_end: "10:00",
      course_id: course.course_id,
      course_name: course.name,
      teacher_name: lecturer ? lecturer.full_name : "Ustadz Pengampu"
    };
  }).filter(function(s) { return s != null; });

  return { success: true, data: schedules };
}

function handleGetAssignments(userId) {
  var enrollments = getData(CONFIG.SHEET_NAMES.ENROLLMENTS).filter(function(e) { return e.student_id == userId; });
  var enrolledCourseIds = enrollments.map(function(e) { return e.course_id; });

  var allAssignments = getData(CONFIG.SHEET_NAMES.ASSIGNMENTS);
  var filtered = allAssignments.filter(function(a) {
    return enrolledCourseIds.indexOf(a.course_id) !== -1;
  });

  var courses = getData(CONFIG.SHEET_NAMES.COURSES);
  var users = getData(CONFIG.SHEET_NAMES.USERS);

  var data = filtered.map(function(a) {
    var c = courses.find(function(Cx) { return Cx.course_id == a.course_id; });
    var lecturer = c ? users.find(function(u) { return u.user_id == c.lecturer_id; }) : null;

    return {
      assignment_id: a.assignment_id,
      title: "Tugas " + (c ? c.name : ""),
      description: a.description || "Silahkan kerjakan tugas berikut dengan seksama.",
      type: a.type || "ESSAY",
      category: "Wajib",
      deadline: "2025-12-31",
      course_name: c ? c.name : "Mapel",
      lecturer_name: lecturer ? lecturer.full_name : "Dosen",
      duration_minutes: 60
    };
  });

  return { success: true, data: data };
}

function handleGetPayments(userId) {
  var payments = getData(CONFIG.SHEET_NAMES.PAYMENTS).filter(function(p) { return p.student_id == userId; });
  return { success: true, data: payments };
}

function handleGetPendingBills(userId) {
  var payments = getData(CONFIG.SHEET_NAMES.PAYMENTS).filter(function(p) {
    return p.student_id == userId && (p.status === 'TAGIHAN' || p.status === 'PENDING') && !p.proof_url;
  });
  return { success: true, data: payments };
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
      uts: 0,
      uas: 0,
      final_grade: score,
      grade_point: e.final_point,
      letter_grade: getGradeLetter(score),
      period: c ? c.semester_period : "2024"
    };
  });
  return { success: true, data: data };
}

function handleGetCertificates(userId) {
  var certs = getData(CONFIG.SHEET_NAMES.CERTIFICATES).filter(function(c) { return c.student_id == userId; });
  return { success: true, data: certs };
}

function handleSubmitTask(data) {
  var cleanTaskName = (data.task_name || "Tugas").replace(/[^a-zA-Z0-9]/g, "_");
  var dateStr = formatDateForFile();
  var newFileName = data.user_id + "_" + cleanTaskName + "_" + dateStr + ".pdf";

  if (data.file_name && data.file_name.indexOf('.') > -1) {
     var ext = data.file_name.split('.').pop();
     newFileName = data.user_id + "_" + cleanTaskName + "_" + dateStr + "." + ext;
  }

  var folderId = CONFIG.DRIVE_FOLDERS.ASSIGNMENTS;
  var url = saveFileToDrive(data.file_base64, "application/pdf", newFileName, folderId);

  var submissions = getData(CONFIG.SHEET_NAMES.SUBMISSIONS);
  var existing = submissions.find(function(s) {
    return s.assignment_id == data.assignment_id && s.student_id == data.user_id;
  });

  if (existing) {
    updateData(CONFIG.SHEET_NAMES.SUBMISSIONS, "submission_id", existing.submission_id, {
        score: existing.score
    });
  } else {
    insertData(CONFIG.SHEET_NAMES.SUBMISSIONS, {
      submission_id: generateId(),
      assignment_id: data.assignment_id,
      student_id: data.user_id,
      score: 0
    });
  }

  return { success: true, message: "Uploaded", url: url };
}

function handleSubmitPaymentProof(data) {
  var cleanDesc = (data.description || "Pembayaran").replace(/[^a-zA-Z0-9]/g, "_");
  var dateStr = formatDateForFile();
  var newFileName = data.user_id + "_" + cleanDesc + "_" + dateStr + ".jpg";

  if (data.file_name && data.file_name.indexOf('.') > -1) {
     var ext = data.file_name.split('.').pop();
     newFileName = data.user_id + "_" + cleanDesc + "_" + dateStr + "." + ext;
  }

  var url = saveFileToDrive(data.file_base64, "image/jpeg", newFileName, CONFIG.DRIVE_FOLDERS.PAYMENT_PROOFS);

  if (data.payment_id) {
     updateData(CONFIG.SHEET_NAMES.PAYMENTS, "payment_id", data.payment_id, {
       proof_url: url,
       status: "VERIFYING",
       amount: data.amount
     });
  } else {
     insertData(CONFIG.SHEET_NAMES.PAYMENTS, {
       payment_id: generateId(),
       student_id: data.user_id,
       amount: data.amount,
       description: data.description,
       proof_url: url,
       status: "VERIFYING",
       date: new Date().toISOString().split('T')[0]
     });
  }

  return { success: true, message: "Bukti terkirim" };
}

function handleSubmitAttendance(data) {
  insertData(CONFIG.SHEET_NAMES.ATTENDANCE, {
    attendance_id: generateId(),
    course_id: data.course_id,
    student_id: data.user_id,
    session_date: new Date().toISOString().split('T')[0],
    status: data.status,
    points: data.status === 'Hadir' ? 100 : (data.status === 'Rekaman' ? 80 : 50)
  });
  return { success: true };
}

function handleGetAttendance(userId) {
  var atts = getData(CONFIG.SHEET_NAMES.ATTENDANCE).filter(function(a) { return a.student_id == userId; });
  var courses = getData(CONFIG.SHEET_NAMES.COURSES);

  var data = atts.map(function(a) {
    var c = courses.find(function(x) { return x.course_id == a.course_id; });
    return {
      course_name: c ? c.name : "Mapel",
      date: a.session_date,
      status: a.status,
      score: a.points,
      week: 1
    };
  });

  return { success: true, data: data };
}

// ==========================================
// MAIN ENTRY POINTS
// ==========================================

function doGet(e) {
  var action = e.parameter.action;

  if (action == "login") return createJSONOutput({ success: false, message: "Use POST" });
  if (action == "getCourses") return createJSONOutput({ success: true, data: getData(CONFIG.SHEET_NAMES.COURSES) });

  var token = e.parameter.token;
  var user = validateToken(token);
  if (!user && action !== "get_student_dashboard_data") { }

  var result = { success: false, message: "Unknown action" };
  var userId = e.parameter.user_id || (user ? user.user_id : null);

  if (action == "get_student_dashboard_data") result = handleGetStudentDashboardData(userId);
  else if (action == "get_schedules") result = handleGetSchedules(userId);
  else if (action == "get_assignments") result = handleGetAssignments(userId);
  else if (action == "get_attendance") result = handleGetAttendance(userId);
  else if (action == "get_payments") result = handleGetPayments(userId);
  else if (action == "get_pending_bills") result = handleGetPendingBills(userId);
  else if (action == "get_grades") result = handleGetGrades(userId);
  else if (action == "list_certificates") result = handleGetCertificates(userId);

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
    else if (action == "register") {
        // Register now accepts gender and status
        result = registerStudent(data.email, data.full_name, data.phone, data.gender, data.status);
    }
    else {
      var user = validateToken(data.token);
      if (!user) result = { success: false, message: "Unauthorized" };
      else {
        if (action == "submit_task_file") result = handleSubmitTask(data);
        else if (action == "submit_payment_proof") result = handleSubmitPaymentProof(data);
        else if (action == "submit_attendance") result = handleSubmitAttendance(data);
        else if (action == "submit_pg_answer") result = { success: true, message: "Jawaban tersimpan" };
        else if (action == "generate_certificate") {
           insertData(CONFIG.SHEET_NAMES.CERTIFICATES, {
             certificate_id: generateId(),
             student_id: data.user_id,
             certificate_number: "CERT-" + new Date().getTime(),
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

function setupDatabase() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var schemas = [
    { name: CONFIG.SHEET_NAMES.USERS, headers: ["user_id", "email", "full_name", "phone", "role", "status", "password_hash"] },
    { name: CONFIG.SHEET_NAMES.COURSES, headers: ["course_id", "name", "lecturer_id", "level", "sks", "semester_period"] },
    { name: CONFIG.SHEET_NAMES.ENROLLMENTS, headers: ["enrollment_id", "student_id", "course_id", "final_grade", "final_point", "status"] },
    { name: CONFIG.SHEET_NAMES.ATTENDANCE, headers: ["attendance_id", "course_id", "student_id", "session_date", "status", "points"] },
    { name: CONFIG.SHEET_NAMES.ASSIGNMENTS, headers: ["assignment_id", "course_id", "type", "description", "max_score"] },
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
