// Import dependencies if running in Node.js
if (typeof require !== 'undefined') {
  var Config = require('./Config');
}

var Grading = {

  /**
   * Calculate Final Score based on components.
   * Formula: (Attendance * 20%) + (Assignment * 15%) + (UTS * 30%) + (UAS * 35%)
   */
  calculateFinalScore: function(attendanceScore, assignmentScore, utsScore, uasScore) {
    var finalScore = (attendanceScore * Config.GRADING_WEIGHT.ATTENDANCE) +
                     (assignmentScore * Config.GRADING_WEIGHT.ASSIGNMENT) +
                     (utsScore * Config.GRADING_WEIGHT.UTS) +
                     (uasScore * Config.GRADING_WEIGHT.UAS);
    return parseFloat(finalScore.toFixed(2));
  },

  /**
   * Determine Point and Predicate based on Final Score.
   * Rules:
   * 90 - 100 : 4.0 (Mumtaz) -> LULUS
   * 80 - 89  : 3.0 (Jayyid Jiddan) -> LULUS
   * < 80     : < 3.0 -> GAGAL
   */
  determineGrade: function(finalScore) {
    var point = 0.0;
    var status = Config.ENROLLMENT_STATUS.FAILED;
    var predicate = "FAIL";

    if (finalScore >= 90) {
      point = 4.0;
      status = Config.ENROLLMENT_STATUS.PASSED;
      predicate = "MUMTAZ";
    } else if (finalScore >= 80) {
      point = 3.0;
      status = Config.ENROLLMENT_STATUS.PASSED;
      predicate = "JAYYID JIDDAN";
    } else {
      // Below 80 is Failed (< 3.0)
      // We can implement finer grain points if needed, but spec implies < 3.0 is Fail.
      // Let's approximate roughly: 70-79 -> 2.0, etc. or just keep it simple as per spec "Passing Grade: Nilai Poin minimal 3.0"
      if (finalScore >= 70) point = 2.0;
      else if (finalScore >= 60) point = 1.0;
      else point = 0.0;

      status = Config.ENROLLMENT_STATUS.FAILED;
    }

    return {
      final_score: finalScore,
      final_point: point,
      status: status,
      predicate: predicate
    };
  },

  /**
   * Calculate Attendance Score from list of sessions.
   * Input: Array of status strings ["HADIR", "IZIN", "ALPA", ...]
   * Output: 0-100 score average.
   */
  calculateAttendanceScore: function(attendanceStatuses) {
    if (!attendanceStatuses || attendanceStatuses.length === 0) return 0;

    var totalPoints = 0;
    for (var i = 0; i < attendanceStatuses.length; i++) {
      var status = attendanceStatuses[i];
      var points = Config.ATTENDANCE_SCORE[status] || 0;
      totalPoints += points;
    }

    // Average score = Total Points / Number of Sessions
    var avg = totalPoints / attendanceStatuses.length;
    return parseFloat(avg.toFixed(2));
  }
};

if (typeof module !== 'undefined') {
  module.exports = Grading;
}
