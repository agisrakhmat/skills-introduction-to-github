var Attendance = {
  /**
   * Submits attendance for a student.
   * @param {string} studentId
   * @param {string} courseId
   * @param {string} status (HADIR, REKAMAN, IZIN, ALPA)
   * @param {string|Date} date
   * @return {TextOutput}
   */
  submit: function(studentId, courseId, status, date) {
    var points = Config.ATTENDANCE_SCORES[status];
    if (points === undefined) {
      return Utils.createErrorResponse('Invalid status: ' + status, 400);
    }

    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ATTENDANCE);

    var id = Utils.generateUUID();
    var dateObj = new Date(date);

    sheet.appendRow([id, courseId, studentId, dateObj, status, points]);

    return Utils.createSuccessResponse({ attendance_id: id, points: points }, 'Attendance recorded');
  },

  /**
   * Calculates average attendance score for a course.
   * @param {string} studentId
   * @param {string} courseId
   * @return {number} Average score (0-100)
   */
  calculateAverage: function(studentId, courseId) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ATTENDANCE);
    if (!sheet) return 0;

    var data = sheet.getDataRange().getValues();
    var total = 0;
    var count = 0;

    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == courseId && data[i][2] == studentId) {
        total += (parseInt(data[i][5]) || 0);
        count++;
      }
    }

    if (count === 0) return 0;
    return total / count;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Attendance;
}
