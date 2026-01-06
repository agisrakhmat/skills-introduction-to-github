// --- Users.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }

var Users = {

  /**
   * Generates a new unique NIM based on user details.
   * Format: DI.{GENDER}.{TAHUN}.{ANGKATAN}.{STATUS}.{SEQ_4_DIGIT}
   */
  generateNIM: function(gender, angkatanCode, status) {
    // 1. Determine Parts
    var genderCode = (gender.toLowerCase().startsWith('l') || gender === 'IN') ? 'IN' : 'AT';
    var yearCode = new Date().getFullYear().toString().slice(-2);

    var validStatuses = ["ADM", "FAA", "RGR", "RPL"];
    var statusCode = validStatuses.includes(status) ? status : "RGR";

    var angkatan = ("00" + angkatanCode).slice(-2);

    // Prefix pattern
    var prefix = "DI." + genderCode + "." + yearCode + "." + angkatan + "." + statusCode + ".";

    // 2. Find Max Sequence from DB
    // Optimization: In a real heavy DB, we might want a separate counters sheet.
    // For Sheets as DB, iterating is okay for < 5000 rows.
    var allUsers = Database.getTable(Config.SHEETS.USERS_MAHASISWA);
    var maxSeq = 0;

    for(var i=0; i<allUsers.length; i++) {
      var u = allUsers[i];
      if (u.NIM && u.NIM.startsWith(prefix)) {
        var parts = u.NIM.split('.');
        var seqStr = parts[parts.length - 1];
        var seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    // 3. Increment and Format
    var newSeq = maxSeq + 1;
    var newSeqStr = ("0000" + newSeq).slice(-4);

    return prefix + newSeqStr;
  },

  findUserByEmailOrWA: function(email, noWa, role) {
    var sheetName = (role === Config.ROLES.MAHASISWA) ?
                    Config.SHEETS.USERS_MAHASISWA :
                    Config.SHEETS.USERS_STAFF;

    var users = Database.getTable(sheetName);
    var searchEmail = email.toLowerCase().trim();
    var searchWA = noWa.replace(/[^0-9]/g, '');

    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var uEmail = (u.Email || "").toLowerCase().trim();
      var uWA = (u.NoWA || "").toString().replace(/[^0-9]/g, '');

      if (uEmail === searchEmail || uWA === searchWA) {
        return u;
      }
    }
    return null;
  },

  createUser: function(userData, role) {
      var sheetName = (role === Config.ROLES.MAHASISWA) ?
                      Config.SHEETS.USERS_MAHASISWA :
                      Config.SHEETS.USERS_STAFF;

      return Database.insertRow(sheetName, userData);
  }
};

if (typeof module !== 'undefined') module.exports = Users;
