/**
 * AdminController.gs
 * Handles Certificates and User Management.
 */

if (typeof DatabaseWrapper === 'undefined' && typeof require !== 'undefined') {
  var DatabaseWrapper = require('./DatabaseWrapper.gs');
}
if (typeof AcademicController === 'undefined' && typeof require !== 'undefined') {
  var AcademicController = require('./AcademicController.gs');
}

var AdminController = (function() {

  function generateCertificate(studentId, courseId) {
     var gradeInfo = AcademicController.calculateGrade(studentId, courseId);

     if (!gradeInfo.passed) {
       throw new Error("Cannot generate certificate: Student failed the course.");
     }

     return "https://drive.google.com/cert/fake_id";
  }

  function resetPassword(userId, newPassword) {
      return true;
  }

  return {
    generateCertificate: generateCertificate,
    resetPassword: resetPassword
  };

})();

if (typeof module !== 'undefined') {
  module.exports = AdminController;
}
