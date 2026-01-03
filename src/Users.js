var Users = {

  /**
   * Retrieves all users from the database, utilizing cache.
   * @return {Array<Object>} List of user objects.
   */
  getAllUsers: function() {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('ALL_USERS_DATA');
    if (cached) {
      return JSON.parse(cached);
    }

    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.USERS);
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var users = [];

    // Skip header row
    for (var i = 1; i < data.length; i++) {
      // Ensure row is not empty
      if (data[i][0]) {
        users.push({
          user_id: data[i][0],
          email: data[i][1],
          full_name: data[i][2],
          phone: data[i][3].toString(), // Ensure phone is string
          role: data[i][4],
          status: data[i][5],
          password_hash: data[i][6]
        });
      }
    }

    // Cache for 20 minutes
    cache.put('ALL_USERS_DATA', JSON.stringify(users), 1200);
    return users;
  },

  /**
   * Finds a user by ID, Email, or Phone.
   * @param {string} login - The search criteria.
   * @return {Object|null} The user object or null if not found.
   */
  findByLogin: function(login) {
    if (!login) return null;

    var users = this.getAllUsers();
    var search = login.toString();

    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.user_id === search || u.email === search || u.phone === search) {
        return u;
      }
    }
    return null;
  },

  /**
   * Generates the next Student ID based on gender and current batch.
   * Format: DI.AA.BB.CC.DDD.EEEE
   * @param {string} gender - 'L'/'M' (Male) or 'P'/'F' (Female)
   * @return {string} The generated ID.
   */
  generateNextStudentId: function(gender) {
    // Determine code: IN (Ikhwan/Male) or AT (Akhwat/Female)
    var code = 'IN';
    if (gender && (gender.toString().toUpperCase().startsWith('P') || gender.toString().toUpperCase().startsWith('F') || gender.toString().toUpperCase() === 'AKHWAT')) {
      code = 'AT';
    }

    var prefix = 'DI.' + code + '.' + Config.CURRENT_YEAR + '.' + Config.CURRENT_BATCH + '.RGR.';

    // We must ensure we have the latest data for ID generation
    // Force refresh cache or read directly if critical?
    // Since createUser invalidates cache, getAllUsers should be fresh enough if we are inside a Lock.
    var users = this.getAllUsers();
    var maxSeq = 0;

    for (var i = 0; i < users.length; i++) {
      var uid = users[i].user_id;
      if (uid && uid.startsWith(prefix)) {
        var parts = uid.split('.');
        var seqStr = parts[parts.length - 1];
        var seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    var nextSeq = maxSeq + 1;
    var nextSeqStr = ('0000' + nextSeq).slice(-4);

    return prefix + nextSeqStr;
  },

  /**
   * Creates a new user.
   * @param {Object} userData
   * @return {Object} The created user object.
   */
  createUser: function(userData) {
    var ss = Utils.getDatabase();
    var sheet = ss.getSheetByName(Config.SHEETS.USERS);

    // Generate ID if not provided (for Students)
    if (!userData.user_id && userData.role === Config.ROLES.STUDENT) {
      userData.user_id = this.generateNextStudentId(userData.gender);
    } else if (!userData.user_id) {
       // Fallback UUID for non-students if not provided
       userData.user_id = Utils.generateUUID();
    }

    // Default password logic: last 4 digits of phone
    var rawPassword = userData.phone.toString().slice(-4);
    var passwordHash = Auth.hashPassword(rawPassword);

    var row = [
      userData.user_id,
      userData.email,
      userData.full_name,
      userData.phone,
      userData.role,
      Config.STATUS.ACTIVE,
      passwordHash
    ];

    sheet.appendRow(row);

    // Invalidate cache
    CacheService.getScriptCache().remove('ALL_USERS_DATA');

    return {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Users;
}
