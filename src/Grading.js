var Grading = {
  /**
   * Calculates final score based on weights.
   */
  calculateScore: function(attendance, assignment, uts, uas) {
    var weights = Config.WEIGHTS;
    var final = (attendance * weights.ATTENDANCE) +
                (assignment * weights.ASSIGNMENT) +
                (uts * weights.UTS) +
                (uas * weights.UAS);
    return parseFloat(final.toFixed(2));
  },

  /**
   * Converts score to point (4.0 scale).
   */
  getPoint: function(score) {
    if (score >= 90) return 4.0;
    if (score >= 80) return 3.0;
    if (score >= 70) return 2.0;
    if (score >= 60) return 1.0;
    return 0.0;
  },

  /**
   * Gets predicate string.
   */
  getPredicate: function(point) {
    if (point >= 4.0) return 'Mumtaz';
    if (point >= 3.0) return 'Jayyid Jiddan';
    if (point >= 2.0) return 'Jayyid';
    return 'Rasib';
  },

  /**
   * Checks if passed (Min 3.0).
   */
  isPassed: function(point) {
    return point >= 3.0;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Grading;
}
