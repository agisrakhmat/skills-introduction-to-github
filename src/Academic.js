if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }

var Academic = {

  calculateFinalScore: function(nilaiAbsen, nilaiTugas, nilaiUTS, nilaiUAS) {
    var score = (nilaiAbsen * 0.15) + (nilaiTugas * 0.15) + (nilaiUTS * 0.30) + (nilaiUAS * 0.40);
    return Math.round(score * 100) / 100;
  },

  determinePredicate: function(score) {
    if (score >= 100) return { predikat: "Mumtaz Murtafi'", status: "LULUS", letter: "A" };
    if (score >= 90) return { predikat: "Mumtaz", status: "LULUS", letter: "A" };
    if (score >= 80) return { predikat: "Jayyid Jiddan", status: "LULUS", letter: "B" };
    if (score >= 70) return { predikat: "Jayyid", status: "LULUS", letter: "C" };
    if (score >= 60) return { predikat: "Rasib", status: "LULUS", letter: "D" };
    return { predikat: "Maqbul", status: "GAGAL", letter: "E" };
  },

  calculateAttendanceScore: function(nim, kodeMK) {
    var allPresensi = Database.getTable(Config.SHEETS.PRESENSI);
    var studentPresensi = allPresensi.filter(function(p) {
      return p.NIM === nim && p.Kode_MK === kodeMK;
    });

    if (studentPresensi.length === 0) return 0;
    var totalPoin = 0;
    studentPresensi.forEach(function(p) {
      totalPoin += Number(p.Poin || 0);
    });
    return totalPoin / studentPresensi.length;
  },

  submitAttendance: function(nim, kodeMK, pertemuanKe, type, linkBukti) {
    var poin = 0;
    var typeNorm = type.toLowerCase();

    if (typeNorm.includes("zoom") || typeNorm.includes("live") || typeNorm.includes("hadir")) poin = 100;
    else if (typeNorm.includes("rekaman")) poin = 90;
    else if (typeNorm.includes("izin") || typeNorm.includes("sakit")) poin = 60;
    else poin = 0;

    var data = {
      "ID_Presensi": "PRS." + new Date().getTime() + "." + nim,
      "NIM": nim,
      "Kode_MK": kodeMK,
      "Pertemuan_Ke": pertemuanKe || 1,
      "Status_Hadir": type,
      "Poin": poin,
      "Tanggal": Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
      "Bukti_Izin": linkBukti || ""
    };

    try {
        Database.insertRow(Config.SHEETS.PRESENSI, data);
        return { success: true, message: "Presensi berhasil dicatat.", poin: poin };
    } catch (e) {
        return { success: false, message: "Error presensi: " + e.message };
    }
  },

  processFinalGrade: function(nim, kodeMK, nilaiTugas, nilaiUTS, nilaiUAS) {
    var avgAbsen = this.calculateAttendanceScore(nim, kodeMK);
    var finalScore = this.calculateFinalScore(avgAbsen, nilaiTugas, nilaiUTS, nilaiUAS);
    var predikatObj = this.determinePredicate(finalScore);

    var data = {
      "ID_Nilai": "GRD." + nim + "." + kodeMK,
      "NIM": nim,
      "Kode_MK": kodeMK,
      "Nilai_Absen": avgAbsen,
      "Nilai_Latihan": nilaiTugas,
      "Nilai_UTS": nilaiUTS,
      "Nilai_UAS": nilaiUAS,
      "Nilai_Akhir": finalScore,
      "Predikat": predikatObj.predikat,
      "Status_Lulus": predikatObj.status
    };

    Database.insertRow(Config.SHEETS.NILAI, data);
    return data;
  },

  getStudentGrades: function(nim) {
      var allNilai = Database.getTable(Config.SHEETS.NILAI);
      var allMK = Database.getTable(Config.SHEETS.MATAKULIAH);

      var studentGrades = allNilai.filter(function(n) { return n.NIM === nim; });

      return studentGrades.map(function(g) {
          var mk = allMK.find(function(m) { return m.Kode_MK === g.Kode_MK; }) || {};
          var pred = Academic.determinePredicate(Number(g.Nilai_Akhir || 0));
          return {
              course_name: mk.Nama_MK || g.Kode_MK,
              sks: mk.SKS || 2,
              uts: g.Nilai_UTS,
              uas: g.Nilai_UAS,
              final_grade: g.Nilai_Akhir,
              letter_grade: pred.letter,
              period: "Semester " + (mk.Mustawa || "1")
          };
      });
  },

  getSchedules: function(nim) {
      var allJadwal = Database.getTable(Config.SHEETS.JADWAL);
      var allMK = Database.getTable(Config.SHEETS.MATAKULIAH);

      return allJadwal.map(function(j) {
          var mk = allMK.find(function(m) { return m.Kode_MK === j.Kode_MK; }) || {};
          return {
              course_id: j.Kode_MK,
              course_name: mk.Nama_MK || j.Kode_MK,
              day: j.Hari,
              time_start: j.Jam_Mulai,
              time_end: j.Jam_Selesai,
              teacher_name: "Dosen " + (mk.Dosen_Pengampu || ""),
              link_zoom: j.Link_Zoom
          };
      });
  },

  getAttendanceHistory: function(nim) {
      var allPresensi = Database.getTable(Config.SHEETS.PRESENSI);
      var studentPresensi = allPresensi.filter(function(p) { return p.NIM === nim; });
      var allMK = Database.getTable(Config.SHEETS.MATAKULIAH);

      return studentPresensi.map(function(p) {
          var mk = allMK.find(function(m) { return m.Kode_MK === p.Kode_MK; }) || {};
          return {
              course_name: mk.Nama_MK || p.Kode_MK,
              date: p.Tanggal,
              status: p.Status_Hadir,
              score: p.Poin,
              week: p.Pertemuan_Ke
          };
      });
  },

  getAssignments: function(nim) {
      return [
          { title: "Tugas Resume Fiqih", type: "essay", deadline: "2025-02-20", course_name: "Fiqih Ibadah" },
          { title: "Kuis Nahwu Dasar", type: "pg", deadline: "2025-02-22", course_name: "Nahwu 1" }
      ];
  }
};

if (typeof module !== 'undefined') module.exports = Academic;
