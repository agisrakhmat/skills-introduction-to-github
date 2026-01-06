// --- Academic.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }

var Academic = {

  calculateFinalScore: function(nilaiAbsen, nilaiTugas, nilaiUTS, nilaiUAS) {
    var score = (nilaiAbsen * 0.15) + (nilaiTugas * 0.15) + (nilaiUTS * 0.30) + (nilaiUAS * 0.40);
    return Math.round(score * 100) / 100;
  },

  determinePredicate: function(score) {
    if (score >= 100) return { predikat: "Mumtaz Murtafi'", status: "LULUS" };
    if (score >= 90) return { predikat: "Mumtaz", status: "LULUS" };
    if (score >= 80) return { predikat: "Jayyid Jiddan", status: "LULUS" };
    if (score >= 70) return { predikat: "Jayyid", status: "LULUS" };
    if (score >= 60) return { predikat: "Rasib", status: "LULUS" };
    return { predikat: "Maqbul", status: "GAGAL" };
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

    if (typeNorm.includes("zoom") || typeNorm.includes("live")) poin = 100;
    else if (typeNorm.includes("rekaman")) poin = 90;
    else if (typeNorm.includes("izin") || typeNorm.includes("sakit")) poin = 60;
    else poin = 0;

    var data = {
      "ID_Presensi": "PRS." + new Date().getTime() + "." + nim,
      "NIM": nim,
      "Kode_MK": kodeMK,
      "Pertemuan_Ke": pertemuanKe,
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
  }
};

if (typeof module !== 'undefined') module.exports = Academic;
