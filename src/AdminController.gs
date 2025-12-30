/**
 * AdminController.gs
 * Handles Admin/Super User features.
 */

var AdminController = {

  /**
   * Manual Password Reset.
   * Only Admin can do this.
   */
  resetPassword: function(adminId, targetUserId, newPassword) {
      // (Optional) Double check adminId status/role if not checked in router
      var targetUser = findRow(TABLES.USERS, 'user_id', targetUserId);
      if (!targetUser) return { status: 'error', message: 'User not found' };

      var passwordHash = AuthController._hashPassword(newPassword);
      updateRow(TABLES.USERS, 'user_id', targetUserId, { password_hash: passwordHash });

      return { status: 'success', message: 'Password reset successfully' };
  },

  /**
   * Generates Certificate (Mock).
   * Checks if student passed (Point >= 3.0).
   */
  generateCertificate: function(adminId, enrollmentId) {
      var enrollment = findRow(TABLES.ENROLLMENTS, 'enrollment_id', enrollmentId);
      if (!enrollment) return { status: 'error', message: 'Enrollment not found' };

      if (enrollment.status !== 'PASSED' || enrollment.final_point < 3.0) {
          return { status: 'error', message: 'Student is not eligible for certificate (Must be PASSED with >= 3.0)' };
      }

      // Check if already exists
      var existingCert = findRows(TABLES.CERTIFICATES, 'enrollment_id', enrollmentId);
      if (existingCert.length > 0) {
          return { status: 'success', message: 'Certificate already exists', data: existingCert[0] };
      }

      // Generate Certificate Data
      var certId = 'CERT.' + enrollmentId;
      var certNum = 'NO/DI/' + new Date().getFullYear() + '/' + Math.floor(Math.random() * 10000); // Mock number

      var certData = {
          certificate_id: certId,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          enrollment_id: enrollmentId,
          certificate_number: certNum,
          issue_date: new Date().toISOString(),
          download_url: 'https://drive.google.com/...' // Mock URL, in real app would generate PDF to Drive
      };

      appendRow(TABLES.CERTIFICATES, certData);

      return { status: 'success', message: 'Certificate generated', data: certData };
  }
};
