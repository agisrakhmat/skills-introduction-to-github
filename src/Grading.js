var Grading = {
  // Constants from Spec 3.1
  Weights: {
    ATTENDANCE: 0.20,
    ASSIGNMENT: 0.15,
    UTS: 0.30,
    UAS: 0.35
  },

  AttendanceValues: {
    HADIR: 100,
    REKAMAN: 80,
    IZIN: 50,
    ALPA: 0
  },

  calculateFinalScore: function(attendanceAvg, assignmentAvg, utsScore, uasScore) {
    var finalScore = (attendanceAvg * this.Weights.ATTENDANCE) +
                     (assignmentAvg * this.Weights.ASSIGNMENT) +
                     (utsScore * this.Weights.UTS) +
                     (uasScore * this.Weights.UAS);
    return parseFloat(finalScore.toFixed(2));
  },

  getAttendanceValue: function(status) {
    return this.AttendanceValues[status] !== undefined ? this.AttendanceValues[status] : 0;
  },

  getPointAndPredicate: function(finalScore) {
    // 90 - 100 : 4.0 (Mumtaz)
    // 80 - 89  : 3.0 (Jayyid Jiddan)
    // < 80     : < 3.0 -> GAGAL

    if (finalScore >= 90) {
      return { point: 4.0, predicate: "Mumtaz", passed: true };
    } else if (finalScore >= 80) {
      return { point: 3.0, predicate: "Jayyid Jiddan", passed: true };
    } else {
      // Logic for < 80
      // Spec says: < 80 : < 3.0 -> GAGAL.
      // It doesn't explicitly define points below 3.0, usually it scales down.
      // But critical rule: "Jika Poin < 3.0, status kelulusan = GAGAL"
      // We can return 0.0 or a calculated lower point, but status is FAILED.
      var point = 0.0;
      if (finalScore >= 60) point = 2.0; // Assumption or leave as Fail

      return { point: point, predicate: "Rasib (Gagal)", passed: false };
    }
  }
};

if (typeof module !== "undefined") {
  module.exports = Grading;
}
