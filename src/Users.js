
if (typeof Config === 'undefined') {
  var Config = require('./Config.js');
}
if (typeof Database === 'undefined') {
  var Database = require('./Database.js');
}

var Users = {
  get_student_dashboard: function(nim) {
    // 1. Get Profile
    var student = Database.findOne(Config.SHEET_NAMES.USERS_MAHASISWA, "NIM", nim);
    if (!student) return { success: false, message: "Mahasiswa tidak ditemukan" };

    // 2. Get Academic Stats (IPK)
    // Formula: Average of all Nilai_Akhir in AKADEMIK_NILAI for this NIM
    var grades = Database.getAll(Config.SHEET_NAMES.AKADEMIK_NILAI);
    var studentGrades = grades.filter(function(g) { return String(g.NIM) === String(nim); });

    var totalScore = 0;
    var count = 0;
    studentGrades.forEach(function(g) {
        var score = parseFloat(g.Nilai_Akhir);
        if (!isNaN(score)) {
            totalScore += score;
            count++;
        }
    });

    var ipk = (count > 0) ? (totalScore / count).toFixed(2) : "0.00";

    // 3. Get Bill Status
    // Logic: Check KEUANGAN_TRANSAKSI for 'Jenis' = 'SPP' or 'Pendaftaran'.
    // If Status_Akademik is 'Non-Aktif', likely pending bill.
    // Dashboard expects: "Lunas" or amount.
    // Simplified: If Status_Akademik == 'Aktif', "Lunas". Else "Menunggu Pembayaran".
    var billStatus = (student.Status_Akademik === 'Aktif') ? "Lunas" : "Belum Lunas";

    // 4. Get Announcements
    // Logic: Fetch latest 3 announcements from GENERAL_PENGUMUMAN
    // Filter by Target: 'ALL' or 'MAHASISWA'
    var announcements = Database.getAll(Config.SHEET_NAMES.GENERAL_PENGUMUMAN);
    var relevantAnnouncements = announcements.filter(function(a) {
        return (a.Target === 'ALL' || a.Target === 'MAHASISWA');
    }).sort(function(a, b) {
        // Sort desc by date (assuming ISO or timestamp, but simplified here)
        return new Date(b.Tanggal) - new Date(a.Tanggal);
    }).slice(0, 5); // Take top 5

    var mappedAnnouncements = relevantAnnouncements.map(function(a) {
        return {
            title: a.Judul,
            content: a.Isi,
            date: a.Tanggal ? new Date(a.Tanggal).toLocaleDateString('id-ID') : "-",
            image: a.Gambar_URL
        };
    });

    return {
        success: true,
        data: {
            status: student.Status_Akademik + " (" + (student.Mustawa ? "Mustawa " + student.Mustawa : "-") + ")",
            ipk: ipk,
            bill: billStatus,
            profile: {
                email: student.Email,
                wa: student.WA,
                nama: student.Nama
            },
            announcements: mappedAnnouncements
        }
    };
  },

  get_staff_list: function() {
      var staff = Database.getAll(Config.SHEET_NAMES.USERS_STAFF);
      var mapped = staff.map(function(s) {
          return {
              id: s.ID_Staff,
              nama: s.Nama,
              role: s.Role,
              wa: s.WA,
              email: s.Email
          };
      });
      return { success: true, data: mapped };
  },

  create_staff: function(data) {
      // Data: nama, email, role, wa
      // ID Generation: DI.{ROLE_CODE}.{SEQ}
      // Roles: Staff Keuangan (SKEU), Staff Akademik (SA), Staff Kesiswaan (SK), Dosen (DS)
      var roleMap = {
          "Staff Keuangan": "SKEU",
          "Staff Akademik": "SA",
          "Staff Kesiswaan": "SK",
          "Dosen": "DS",
          "Super Admin": "ADM"
      };

      var roleCode = roleMap[data.role] || "STF";
      var prefix = Config.PREFIX.STAFF + "." + roleCode;

      var lock = LockService.getScriptLock();
      lock.waitLock(30000);

      try {
          var allStaff = Database.getAll(Config.SHEET_NAMES.USERS_STAFF);
          var maxSeq = 0;
          allStaff.forEach(function(s) {
              if (s.ID_Staff && s.ID_Staff.startsWith(prefix)) {
                   var parts = s.ID_Staff.split('.');
                   var seq = parseInt(parts[parts.length - 1]);
                   if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
              }
          });

          var nextSeq = maxSeq + 1;
          var id = prefix + "." + ("000" + nextSeq).slice(-3);

          // Generate Default Password (last 4 digits of WA)
          var rawPass = data.wa.slice(-4);
          var hashedPass = Auth.hashPassword(rawPass);

          var newStaff = {
              ID_Staff: id,
              Nama: data.nama,
              Email: data.email,
              Password: hashedPass,
              Role: data.role,
              WA: data.wa,
              Foto_URL: ""
          };

          Database.insert(Config.SHEET_NAMES.USERS_STAFF, newStaff);
          return { success: true, message: "Staff created: " + id };

      } catch(e) {
          return { success: false, message: e.message };
      } finally {
          lock.releaseLock();
      }
  },

  delete_staff: function(id) {
      if (Database.delete(Config.SHEET_NAMES.USERS_STAFF, "ID_Staff", id)) {
          return { success: true, message: "Staff deleted" };
      }
      return { success: false, message: "Failed to delete" };
  }
};

if (typeof module !== 'undefined') module.exports = Users;
