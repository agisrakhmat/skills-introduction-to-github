var Assignments = {
  getByCourse: function(courseId) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ASSIGNMENTS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var list = [];
    for(var i=1; i<data.length; i++) {
      if(data[i][1] == courseId) {
        list.push({
          assignment_id: data[i][0],
          course_id: data[i][1],
          type: data[i][2],
          max_score: data[i][3]
        });
      }
    }
    return list;
  },

  create: function(courseId, type, maxScore) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.ASSIGNMENTS);
    var id = Utils.generateUUID();
    sheet.appendRow([id, courseId, type, maxScore]);
    return id;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Assignments;
}
