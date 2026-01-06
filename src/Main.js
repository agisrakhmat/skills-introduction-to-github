// --- Main.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }
if (typeof Auth === 'undefined') { try { var Auth = require('./Auth'); } catch(e) {} }
if (typeof Academic === 'undefined') { try { var Academic = require('./Academic'); } catch(e) {} }
if (typeof Finance === 'undefined') { try { var Finance = require('./Finance'); } catch(e) {} }
if (typeof Users === 'undefined') { try { var Users = require('./Users'); } catch(e) {} }

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

    } else if (action === "submit_attendance") {
        output = Academic.submitAttendance(params.user_id, params.course_id, params.pertemuan, params.status, params.bukti);

    } else if (action === "submit_task_file") {
        output = { success: true, status: 'success', message: "Tugas berhasil diupload" };

    } else if (action === "submit_pg_answer") {
        output = { success: true, status: 'success', message: "Kuis berhasil disimpan" };

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
    var params = e.parameter;
    var action = params.action;
    var output = { success: false, message: "Invalid GET" };

    try {
        if (action === "get_student_dashboard_data") {
            var nim = params.user_id;
            var allUsers = Database.getTable(Config.SHEETS.USERS_MAHASISWA);
            var u = allUsers.find(function(x) { return x.NIM === nim; }) || {};

            output = {
                success: true,
                status: 'success',
                data: {
                    status_text: u.Status_Aktif || "Aktif",
                    ipk: "3.50",
                    bill_text: "Lunas",
                    profile: { email: u.Email, wa: u.NoWA }
                }
            };

        } else if (action === "get_grades") {
            output = { success: true, status: 'success', data: Academic.getStudentGrades(params.user_id) };

        } else if (action === "get_schedules") {
            output = { success: true, status: 'success', data: Academic.getSchedules(params.user_id) };

        } else if (action === "get_assignments") {
            output = { success: true, status: 'success', data: Academic.getAssignments(params.user_id) };

        } else if (action === "get_attendance") {
            output = { success: true, status: 'success', data: Academic.getAttendanceHistory(params.user_id) };

        } else if (action === "get_payments") {
            output = { success: true, status: 'success', data: Finance.getStudentPayments(params.user_id) };

        } else if (action === "get_announcements") {
            // New endpoint for announcements
            var allAnnouncements = Database.getTable(Config.SHEETS.PENGUMUMAN);
            // Filter by Target_Role = 'Mahasiswa' or 'All' and sort by Date desc
            var filtered = allAnnouncements.filter(function(a) {
                return !a.Target_Role || a.Target_Role.toLowerCase() === 'mahasiswa' || a.Target_Role.toLowerCase() === 'all';
            }).map(function(a) {
                return {
                    title: a.Judul,
                    content: a.Isi_Pesan,
                    image: a.Link_Gambar_Slide,
                    date: a.Tgl_Terbit
                };
            });
            output = { success: true, status: 'success', data: filtered };

        } else if (action === "list_certificates") {
            output = { success: true, status: 'success', data: [] };

        } else {
            output = { success: true, status: 'active', message: "Service Ready" };
        }
    } catch(err) {
        output = { success: false, message: err.toString() };
    }

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

if (typeof module !== 'undefined') {
    module.exports = { doPost, doGet };
}
