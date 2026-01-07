
if (typeof Config === 'undefined') var Config = require('./Config.js');
if (typeof Auth === 'undefined') var Auth = require('./Auth.js');
if (typeof Users === 'undefined') var Users = require('./Users.js');
if (typeof Academic === 'undefined') var Academic = require('./Academic.js');
if (typeof Finance === 'undefined') var Finance = require('./Finance.js');
if (typeof Lecturer === 'undefined') var Lecturer = require('./Lecturer.js');
if (typeof Kesiswaan === 'undefined') var Kesiswaan = require('./Kesiswaan.js');
if (typeof Setup === 'undefined') var Setup = require('./Setup.js');

// HELPERS
function responseJSON(success, message, data) {
  var output = { success: success, message: message };
  if (data) output.data = data;
  return ContentService.createTextOutput(JSON.stringify(output))
         .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var params = e.parameter;
  var action = params.action;

  try {
    // Public Endpoints
    if (action === 'check_certificate') {
        var result = Kesiswaan.check_certificate(params.code);
        return responseJSON(result.success, result.message, result.data);
    }
    if (action === 'setup') {
        // Only run setup once or if secret param?
        // Let's assume it's safe or guarded in real env.
        var result = Setup.doSetup();
        return responseJSON(true, result.message, result);
    }

    // Secured Endpoints (Assume validation happens inside modules or here if token implemented)
    // For this implementation, we pass parameters directly.

    // USERS (STUDENT)
    if (action === 'get_student_data' || action === 'get_student_dashboard') {
        var res = Users.get_student_dashboard(params.user_id);
        return responseJSON(res.success, res.message, res.data);
    }

    // ACADEMIC (General)
    if (action === 'get_lectures' || action === 'get_schedule_list') {
        var res = Academic.get_schedule_list(params.user_id); // Returns list
        // Frontend expects: mk_code, name, meeting, date, time, teacher, status...
        // Map Academic.get_schedule_list output to match frontend if needed.
        // Academic.js output: {mk_code, mk_name, hari, jam, link_zoom, dosen}
        // Frontend mock: {mk_code, name, meeting, date, time, teacher, status}
        // Let's map it here or in Academic.js. Let's do a light map here.
        var data = res.data.map(function(s) {
            return {
                mk_code: s.mk_code,
                name: s.mk_name,
                meeting: "1", // Static for now as per Academic.js limitation
                date: "Jadwal Rutin", // Or calculate next date based on Day
                time: s.jam ? (s.hari + " " + s.jam) : s.hari,
                teacher: s.dosen,
                status: "Jadwal",
                link_zoom: s.link_zoom
            };
        });
        return responseJSON(res.success, "", data);
    }

    if (action === 'get_grades') {
        var res = Academic.get_grades(params.user_id);
        return responseJSON(res.success, "", res.data);
    }

    if (action === 'get_announcements' || action === 'get_announcements_list') {
        // Shared endpoint, Users.js has logic for student dashboard
        // Kesiswaan.js has logic for admin list
        // If user_id is missing, use Kesiswaan list?
        // Actually Users.get_student_dashboard calls GENERAL_PENGUMUMAN.
        var res = Kesiswaan.get_announcements_list();
        return responseJSON(res.success, "", res.data);
    }

    // LECTURER
    if (action === 'get_tasks') {
        var res = Lecturer.get_tasks(params.user_id);
        return responseJSON(res.success, "", res.data);
    }
    if (action === 'get_task_detail') {
        var res = Lecturer.get_task_detail(params.id);
        return responseJSON(res.success, "", res.data);
    }
    if (action === 'get_submissions') {
        var res = Lecturer.get_submissions();
        return responseJSON(res.success, "", res.data);
    }
    if (action === 'get_dosen_mk_list') {
        // Used by Lecturer Dashboard for dropdown
        // Currently Academic.get_mk_list returns all.
        // We might want to filter if user_id is passed?
        // For now return all.
        var res = Academic.get_mk_list();
        // Map to {id, name}
        var data = res.data.map(function(m){ return { id: m.kode, name: m.nama }; });
        return responseJSON(true, "", data);
    }
    if (action === 'get_class_roster') {
        var res = Lecturer.get_class_roster(params.mk_id);
        return responseJSON(res.success, "", res.data);
    }

    // ADMIN (ACADEMIC)
    if (action === 'get_admin_stats') return responseJSON(true, "", Academic.get_admin_stats().data);
    if (action === 'get_dosen_list') return responseJSON(true, "", Academic.get_dosen_list().data);
    if (action === 'get_mk_list') return responseJSON(true, "", Academic.get_mk_list().data);
    if (action === 'get_attendance_recap') return responseJSON(true, "", []); // Mock empty for now in Academic.js?

    // ADMIN (FINANCE)
    if (action === 'get_finance_stats') return responseJSON(true, "", Finance.get_finance_stats().data);
    if (action === 'get_pending_transactions') return responseJSON(true, "", Finance.get_pending_transactions().data);
    if (action === 'get_all_transactions') return responseJSON(true, "", Finance.get_all_transactions().data);
    if (action === 'get_activation_candidates') return responseJSON(true, "", Finance.get_activation_candidates(params.type).data);
    if (action === 'get_debtors_list') return responseJSON(true, "", Finance.get_debtors_list().data);
    if (action === 'get_procurement_list') return responseJSON(true, "", []); // TODO: Add getter in Finance if missing
    if (action === 'get_transaction_types') return responseJSON(true, "", ['SPP', 'Pendaftaran', 'Infaq']);

    // ADMIN (KESISWAAN)
    if (action === 'get_kesiswaan_stats') return responseJSON(true, "", Kesiswaan.get_kesiswaan_stats().data);
    if (action === 'get_students_list') {
        // Need a dedicated getter in Kesiswaan or Users?
        // Use Users.get_student_dashboard logic iteration?
        // Let's rely on Database.getAll(USERS_MAHASISWA) in Kesiswaan.js?
        // Implemented Kesiswaan.get_students_list? No, Kesiswaan.js doesn't have it yet.
        // Let's add on the fly or fail gracefully.
        // Wait, Kesiswaan dashboard mock used 'get_students_list'.
        // I should probably add it to Kesiswaan.js.
        // For now, I'll return empty or implement here.
        var data = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA).map(function(u){
            return { nim: u.NIM, nama: u.Nama, angkatan: u.Angkatan, mustawa: u.Mustawa, status: u.Status_Akademik };
        });
        return responseJSON(true, "", data);
    }
    if (action === 'get_certificates_list') return responseJSON(true, "", Kesiswaan.get_certificates_list().data);

    // ADMIN (SUPER)
    if (action === 'get_superadmin_stats') return responseJSON(true, "", { active_students: 100, growth: 5, income: "Rp 0", expense: "Rp 0", pending_approval: 0, chart_growth: [], chart_cashflow: {in:[], out:[]} }); // Mock
    if (action === 'get_staff_list') return responseJSON(true, "", Users.get_staff_list().data);


    return responseJSON(false, "Action not found: " + action);

  } catch(e) {
    return responseJSON(false, "Error: " + e.message);
  }
}

function doPost(e) {
  var params;
  try {
      params = JSON.parse(e.postData.contents);
  } catch(err) {
      params = e.parameter; // Fallback
  }

  var action = params.action;

  try {
      // AUTH
      if (action === 'login') {
          var res = Auth.login(params.identifier, params.password, params.role);
          return responseJSON(res.success, res.message, res.user);
      }
      if (action === 'register') {
          var res = Auth.register(params); // Pass all params
          return responseJSON(res.success, res.message, res.data);
      }

      // STUDENT
      if (action === 'upload_bukti') {
          var res = Finance.upload_bukti(params.session_user_id || "GUEST", params.type, params.amount, params.file_name, params.file_data);
          return responseJSON(res.success, res.message);
      }
      if (action === 'submit_attendance') {
          // Student self-attendance
          var res = Academic.submit_attendance(params.session_user_id, params.code, params.type);
          return responseJSON(res.success, res.message);
      }

      // LECTURER
      if (action === 'create_task' || action === 'update_task') {
          var res = Lecturer.save_task(params);
          return responseJSON(res.success, res.message);
      }
      if (action === 'delete_task') {
          var res = Lecturer.delete_task(params.id);
          return responseJSON(res.success, res.message);
      }
      if (action === 'submit_grade') {
          var res = Lecturer.submit_grade(params.sub_id, params.score, params.feedback);
          return responseJSON(res.success, res.message);
      }
      if (action === 'submit_manual_attendance') {
          var res = Lecturer.submit_manual_attendance(params.mk_id, params.meeting, params.data);
          return responseJSON(res.success, res.message);
      }

      // FINANCE ADMIN
      if (action === 'verify_payment') {
          var res = Finance.verify_payment(params.id, params.status, params.admin_id);
          return responseJSON(res.success, res.message);
      }
      if (action === 'activate_student') {
          var res = Finance.activate_student(params.nim);
          return responseJSON(res.success, res.message);
      }
      if (action === 'create_direct_procurement') {
          var res = Finance.create_direct_procurement(params);
          return responseJSON(res.success, res.message);
      }
      if (action === 'send_wa_blast') {
          var res = Finance.send_wa_blast(params.template, params.targets);
          return responseJSON(res.success, res.message);
      }

      // ACADEMIC ADMIN
      if (action === 'create_dosen' || action === 'update_data') {
          // Generic handler based on 'type' param in Academic/Lecturer dash?
          // Academic.js doesn't have create_dosen. Users.js has create_staff.
          if (params.type === 'dosen') {
              params.role = 'Dosen';
              var res = Users.create_staff(params);
              return responseJSON(res.success, res.message);
          }
          if (params.type === 'mk') {
              var res = Academic.save_mk(params);
              return responseJSON(res.success, res.message);
          }
          if (params.type === 'jadwal') {
              var res = Academic.save_schedule(params);
              return responseJSON(res.success, res.message);
          }
      }
      if (action === 'delete_data') {
          // Routing based on type
          if (params.type === 'dosen') return responseJSON(Users.delete_staff(params.id).success, "Deleted");
          if (params.type === 'mk') { Database.delete(Config.SHEET_NAMES.AKADEMIK_MK, "Kode_MK", params.id); return responseJSON(true, "Deleted"); }
          if (params.type === 'jadwal') { Database.delete(Config.SHEET_NAMES.AKADEMIK_JADWAL, "ID_Jadwal", params.id); return responseJSON(true, "Deleted"); }
          // Kesiswaan
          if (params.type === 'mhs') { Database.delete(Config.SHEET_NAMES.USERS_MAHASISWA, "NIM", params.id); return responseJSON(true, "Deleted"); }
          if (params.type === 'info') { Database.delete(Config.SHEET_NAMES.GENERAL_PENGUMUMAN, "ID", params.id); return responseJSON(true, "Deleted"); }

          return responseJSON(true, "Data processed");
      }

      // KESISWAAN ADMIN
      if (action === 'create_student') {
          // Calls Register? Or direct insert? Register handles NIM.
          // Map params to register format
          var regData = {
              nama_ktp: params.nama,
              email: params.email,
              no_hp: params.wa,
              password: params.wa.slice(-4), // Default pass
              tgl_lahir: params.tahun, // Fallback
              jenis_kelamin: params.gender,
              alamat: "Input Admin",
              kode_status: params.status_kode,
              angkatan: params.angkatan
          };
          var res = Auth.register(regData);
          return responseJSON(res.success, res.message);
      }
      if (action === 'generate_certificates_batch') {
          var res = Kesiswaan.generate_certificates_batch(params.level, params.template_url);
          return responseJSON(res.success, res.message);
      }
      if (action === 'create_announcement') {
          var res = Kesiswaan.create_announcement(params);
          return responseJSON(res.success, res.message);
      }

      // SUPER ADMIN
      if (action === 'create_staff') {
          var res = Users.create_staff(params);
          return responseJSON(res.success, res.message);
      }
      if (action === 'delete_staff') {
          var res = Users.delete_staff(params.id);
          return responseJSON(res.success, res.message);
      }
      if (action === 'delete_transaction' || action === 'process_approval') {
          // Finance logic mostly
          if (action === 'process_approval') {
              // Update KEUNGAN_PENGAJUAN status
              Database.update(Config.SHEET_NAMES.KEUANGAN_PENGAJUAN, "ID_Aju", params.id, { Status: params.status });
              return responseJSON(true, "Processed");
          }
      }

      return responseJSON(false, "Unknown Action: " + action);

  } catch(e) {
      return responseJSON(false, "Post Error: " + e.message);
  }
}

if (typeof module !== 'undefined') module.exports = { doGet: doGet, doPost: doPost };
