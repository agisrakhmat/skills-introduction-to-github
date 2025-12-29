/**
 * Auth Controller
 * Handles Registration and Login
 */

/**
 * Register a new student
 * @param {Object} data - {fullName, email, phone, gender, batch, status}
 */
function registerStudent(data) {
  var users = getSheetData('USERS'); // In production this reads Sheets

  // 1. Validation
  if (!data.email || !data.phone || !data.fullName) {
    return { success: false, message: 'Data tidak lengkap.' };
  }

  // Check duplicates
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u[COLUMNS.USERS.EMAIL] == data.email) return { success: false, message: 'Email sudah terdaftar.' };
    if (u[COLUMNS.USERS.PHONE] == data.phone) return { success: false, message: 'No WA sudah terdaftar.' };
  }

  // 2. Generate Credentials
  var password = data.phone.toString().slice(-4); // Last 4 digits
  var nim = generateNim(data, users);

  // 3. Save to DB (In real GAS, using appendRow)
  var newUser = [
    nim,
    data.email,
    data.fullName,
    data.phone,
    'STUDENT',
    'ACTIVE',
    password
  ];

  // 3. Save to DB
  appendRowToSheet('USERS', newUser);

  return {
    success: true,
    message: 'Registrasi berhasil.',
    data: {
      nim: nim,
      password: password,
      info: 'Gunakan NIM/Email/WA dan 4 digit terakhir WA untuk login.'
    }
  };
}

/**
 * Login User
 * Identifier can be Email, Phone, or NIM (User ID)
 */
function loginUser(identifier, password) {
  var users = getSheetData('USERS');

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var isMatch = (
      u[COLUMNS.USERS.EMAIL] == identifier ||
      u[COLUMNS.USERS.PHONE] == identifier ||
      u[COLUMNS.USERS.USER_ID] == identifier
    );

    if (isMatch) {
      if (u[COLUMNS.USERS.PASSWORD] == password) {
        return {
          success: true,
          token: Utilities_base64Encode(u[COLUMNS.USERS.USER_ID] + ':' + new Date().getTime()), // Simple mock token
          user: {
            id: u[COLUMNS.USERS.USER_ID],
            name: u[COLUMNS.USERS.FULL_NAME],
            role: u[COLUMNS.USERS.ROLE],
            status: u[COLUMNS.USERS.STATUS]
          }
        };
      } else {
        return { success: false, message: 'Password salah.' };
      }
    }
  }

  return { success: false, message: 'User tidak ditemukan.' };
}

/**
 * Helper: Generate NIM
 * Format: DI.AA.BB.CC.DDD.EEEE
 * AA: Gender (IN=Male, AT=Female) - derived from form input usually, assuming default IN here if missing
 * BB: Year (24)
 * CC: Batch (01)
 * DDD: Status (RGR)
 * EEEE: Sequence
 */
function generateNim(data, existingUsers) {
  var genderCode = (data.gender === 'FEMALE') ? 'AT' : 'IN';
  var year = new Date().getFullYear().toString().slice(-2);
  var batch = data.batch || '01';
  var status = 'RGR'; // Default Regular

  var prefix = 'DI.' + genderCode + '.' + year + '.' + batch + '.' + status;

  // Find max sequence with this prefix
  var maxSeq = 0;
  for (var i = 0; i < existingUsers.length; i++) {
    var id = existingUsers[i][COLUMNS.USERS.USER_ID];
    if (id && id.startsWith(prefix)) {
      var parts = id.split('.');
      var seq = parseInt(parts[parts.length-1]);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  var newSeq = (maxSeq + 1).toString().padStart(4, '0');
  return prefix + '.' + newSeq;
}

// Mock Utilities for local testing if needed
function Utilities_base64Encode(str) {
    return typeof Utilities !== 'undefined' ? Utilities.base64Encode(str) : btoa(str);
}
