// --- Main.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }
if (typeof Auth === 'undefined') { try { var Auth = require('./Auth'); } catch(e) {} }
if (typeof Academic === 'undefined') { try { var Academic = require('./Academic'); } catch(e) {} }
if (typeof Finance === 'undefined') { try { var Finance = require('./Finance'); } catch(e) {} }

function doPost(e) {
  var output = { success: false, message: "Invalid Request" };

  try {
    var params = {};
    if (e.postData && e.postData.contents) {
        try {
            params = JSON.parse(e.postData.contents);
        } catch(err) {
            params = e.parameter;
        }
    } else {
        params = e.parameter;
    }

    var action = params.action;

    if (action === "register") {
        output = Auth.registerStudent(params);

    } else if (action === "enroll") {
        output = Finance.enrollStudent(params);

    } else if (action === "login") {
        var role = params.role || Config.ROLES.MAHASISWA;
        output = Auth.login(params.identifier || params.email, params.password, role);

    } else if (action === "submit_presensi") {
        output = Academic.submitAttendance(params.nim, params.kode_mk, params.pertemuan, params.status, params.bukti);

    } else if (action === "setup_db") {
        if (params.admin_secret === "DIPLOMA_ILMI_SETUP_2024") {
             output = { success: true, message: Database.setupDatabase() };
        } else {
             output = { success: false, message: "Unauthorized Setup" };
        }

    } else {
        output = { success: false, message: "Unknown Action: " + action };
    }

  } catch (err) {
    output = { success: false, message: "Server Error: " + err.toString() };
    if (typeof Logger !== 'undefined') Logger.log(err);
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({
        status: "active",
        timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
}

if (typeof module !== 'undefined') {
    module.exports = { doPost, doGet };
}
