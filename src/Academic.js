
if (typeof Config === 'undefined') {
  var Config = require('./Config.js');
}
if (typeof Database === 'undefined') {
  var Database = require('./Database.js');
}

var Academic = {
  get_mk_list: function() {
    var data = Database.getAll(Config.SHEET_NAMES.AKADEMIK_MK);
    var mapped = data.map(function(m) {
      return {
        kode: m.Kode_MK,
        nama: m.Nama_MK,
        mustawa: m.Mustawa,
        dosen: m.ID_Dosen
      };
    });
    return { success: true, data: mapped };
  },

  get_schedule_list: function(userId, userRole) {
    // If student, filter by their Mustawa or Enrolled courses?
    // Requirement says: "Student Dashboard Lecture Filter... based on data returned from get_lectures"
    // Also "Single Level Policy".

    var schedules = Database.getAll(Config.SHEET_NAMES.AKADEMIK_JADWAL);
    var mks = Database.getAll(Config.SHEET_NAMES.AKADEMIK_MK);

    // Join MK data
    var joined = schedules.map(function(s) {
      var mk = mks.find(function(m) { return m.Kode_MK === s.Kode_MK; });
      return {
        id: s.ID_Jadwal,
        mk_code: s.Kode_MK,
        mk_name: mk ? mk.Nama_MK : s.Kode_MK,
        hari: s.Hari,
        jam: s.Jam,
        link_zoom: s.Link_Zoom,
        link_rekaman: s.Link_Rekaman,
        dosen: mk ? mk.ID_Dosen : "-"
      };
    });

    // If Student, we might filter. For now return all or filter by Mustawa if we look up student.
    // Dashboard V3: expects specific keys: mk_code, name, meeting, date, time, teacher, status, link_zoom, link_yt
    // The schema in AKADEMIK_JADWAL is simple (Hari, Jam). It doesn't have "Date" for specific meetings.
    // However, the frontend expects "Lecture List" which implies specific sessions.
    // Assumption: We generate "Next Session" or return static schedule.
    // Frontend mock uses "date: '01 Jan 2025'".
    // For now, let's return the static schedule format for the "Jadwal" tab, and for "Today's Class" we check Day of Week.

    return { success: true, data: joined };
  },

  // Create/Update MK
  save_mk: function(data) {
    // data: id (optional), type='mk', nama, mustawa, dosen
    var mkId = data.id || ("MK." + data.mustawa + "." + data.nama.substring(0,3).toUpperCase());

    var obj = {
      Kode_MK: mkId,
      Nama_MK: data.nama,
      Mustawa: data.mustawa,
      ID_Dosen: data.dosen
    };

    if (data.action === 'create_mk') {
        Database.insert(Config.SHEET_NAMES.AKADEMIK_MK, obj);
    } else {
        Database.update(Config.SHEET_NAMES.AKADEMIK_MK, "Kode_MK", data.id, obj);
    }
    return { success: true, message: "Mata Kuliah saved" };
  },

  // Create/Update Schedule
  save_schedule: function(data) {
     var id = data.id || ("J" + Date.now()); // Simple ID generation
     var obj = {
         ID_Jadwal: id,
         Kode_MK: data.mk,
         Hari: data.hari, // Expected format "Senin, 08:00" or similar? Input type is datetime-local in frontend forms?
         // Frontend 'modal-jadwal' uses input type="datetime-local" id="jadwal-hari".
         // But schema says "Hari" and "Jam". Let's assume we store string.
         Jam: "", // If separate
         Link_Zoom: data.zoom,
         Link_Rekaman: ""
     };
     // Adjust if Hari contains time
     if (data.hari && data.hari.includes('T')) {
         var parts = data.hari.split('T');
         obj.Hari = parts[0]; // Date part or convert to Day name?
         obj.Jam = parts[1];
     } else {
         obj.Hari = data.hari;
     }

     if (data.action === 'create_schedule') {
         Database.insert(Config.SHEET_NAMES.AKADEMIK_JADWAL, obj);
     } else {
         Database.update(Config.SHEET_NAMES.AKADEMIK_JADWAL, "ID_Jadwal", data.id, obj);
     }
     return { success: true, message: "Jadwal saved" };
  },

  // Student Actions
  get_grades: function(nim) {
      var allGrades = Database.getAll(Config.SHEET_NAMES.AKADEMIK_NILAI);
      var mks = Database.getAll(Config.SHEET_NAMES.AKADEMIK_MK);

      var studentGrades = allGrades.filter(function(g) { return String(g.NIM) === String(nim); });

      var result = studentGrades.map(function(g) {
          var mk = mks.find(function(m) { return m.Kode_MK === g.Kode_MK; });
          return {
              course: mk ? mk.Nama_MK : g.Kode_MK,
              sks: 2, // Default or fetch?
              grade: g.Predikat,
              score: parseFloat(g.Nilai_Akhir)
          };
      });
      return { success: true, data: result };
  },

  submit_attendance: function(nim, code, type) {
      // code is MK Code?
      // Check if already submitted today?
      // Frontend sends: action:'submit_attendance', code:mkCode, type:'ZOOM'/'YOUTUBE'

      var today = new Date().toLocaleDateString('id-ID'); // Simple date key
      // Or use timestamp

      var record = {
          ID_Presensi: "P." + nim + "." + code + "." + Date.now(),
          NIM: nim,
          Kode_MK: code,
          Pertemuan_Ke: "?", // Logic to determine meeting number needed
          Tipe_Hadir: type,
          Status: "Hadir",
          Nilai: (type === 'ZOOM') ? 100 : 90,
          Waktu_Input: new Date().toISOString()
      };

      Database.insert(Config.SHEET_NAMES.AKADEMIK_PRESENSI, record);
      return { success: true, message: "Presensi Berhasil" };
  },

  // Admin Stats
  get_admin_stats: function() {
      var dosen = Database.getAll(Config.SHEET_NAMES.USERS_STAFF).filter(function(s){ return s.Role === 'Dosen'; }).length;
      var mk = Database.getAll(Config.SHEET_NAMES.AKADEMIK_MK).length;
      var kelas = Database.getAll(Config.SHEET_NAMES.AKADEMIK_JADWAL).length; // Approximation
      return {
          success: true,
          data: {
              dosen: dosen,
              mk: mk,
              kelas: kelas,
              hadir: "85%" // Dummy/Calc required
          }
      };
  },

  get_dosen_list: function() {
       var staff = Database.getAll(Config.SHEET_NAMES.USERS_STAFF);
       var dosen = staff.filter(function(s) { return s.Role === 'Dosen'; }).map(function(d){
           return { id: d.ID_Staff, nama: d.Nama, email: d.Email, wa: d.WA };
       });
       return { success: true, data: dosen };
  }
};

if (typeof module !== 'undefined') module.exports = Academic;
