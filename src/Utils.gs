var Utils = {
  /**
   * Creates a standardized JSON success response.
   * @param {Object} data - The data to return.
   * @param {string} message - Optional success message.
   * @return {TextOutput}
   */
  createSuccessResponse: function(data, message) {
    var response = {
      status: 'success',
      data: data,
      message: message || 'Operation successful'
    };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Creates a standardized JSON error response.
   * @param {string} message - The error message.
   * @param {number} code - Optional error code (default 500).
   * @return {TextOutput}
   */
  createErrorResponse: function(message, code) {
    var response = {
      status: 'error',
      message: message,
      code: code || 500
    };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Gets the spreadsheet object. Fallback to active spreadsheet if ID is invalid.
   * @return {Spreadsheet}
   */
  getDatabase: function() {
    if (Config.SPREADSHEET_ID && Config.SPREADSHEET_ID !== '') {
      try {
        return SpreadsheetApp.openById(Config.SPREADSHEET_ID);
      } catch (e) {
        console.warn('Could not open spreadsheet by ID, falling back to active spreadsheet.');
      }
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * Formats a date to DD/MM/YYYY.
   * @param {Date} date
   * @return {string}
   */
  formatDate: function(date) {
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  },

  /**
   * Generates a UUID-like string.
   * @return {string}
   */
  generateUUID: function() {
    return Utilities.getUuid();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
