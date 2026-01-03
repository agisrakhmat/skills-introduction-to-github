var Submissions = {
  getScore: function(assignmentId, studentId) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.SUBMISSIONS);
    if (!sheet) return 0;

    var data = sheet.getDataRange().getValues();
    for(var i=1; i<data.length; i++) {
      if(data[i][1] == assignmentId && data[i][2] == studentId) {
        return parseFloat(data[i][3]) || 0;
      }
    }
    return 0;
  },

  submit: function(assignmentId, studentId, score) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.SUBMISSIONS);
    var id = Utils.generateUUID();
    sheet.appendRow([id, assignmentId, studentId, score]);
    return id;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Submissions;
}
