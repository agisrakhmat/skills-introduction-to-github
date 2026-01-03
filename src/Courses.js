var Courses = {
  /**
   * Retrieves all courses from cache or database.
   * @return {Array<Object>}
   */
  getAllCourses: function() {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('ALL_COURSES');
    if (cached) {
      return JSON.parse(cached);
    }

    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.COURSES);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var courses = [];

    // Skip header
    for (var i = 1; i < data.length; i++) {
       if (data[i][0]) {
         courses.push({
           course_id: data[i][0],
           name: data[i][1],
           lecturer_id: data[i][2],
           level: parseInt(data[i][3]),
           sks: parseInt(data[i][4]),
           semester_period: data[i][5]
         });
       }
    }

    // Cache for 30 mins
    cache.put('ALL_COURSES', JSON.stringify(courses), 1800);
    return courses;
  },

  /**
   * Gets courses by level.
   * @param {number} level
   * @return {Array<Object>}
   */
  getByLevel: function(level) {
    var courses = this.getAllCourses();
    return courses.filter(function(c) { return c.level == level; });
  },

  /**
   * Gets a course by ID.
   * @param {string} id
   * @return {Object|null}
   */
  getById: function(id) {
    var courses = this.getAllCourses();
    for(var i=0; i<courses.length; i++) {
      if(courses[i].course_id == id) return courses[i];
    }
    return null;
  },

  /**
   * Creates a course (Helper for Admin/Setup).
   */
  createCourse: function(data) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.COURSES);

    var id = data.course_id || Utils.generateUUID();

    sheet.appendRow([
      id,
      data.name,
      data.lecturer_id,
      data.level,
      data.sks,
      data.semester_period
    ]);

    CacheService.getScriptCache().remove('ALL_COURSES');
    return id;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Courses;
}
