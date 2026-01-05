var Courses = {
  // Logic: Mustawa Sequential & Single Level Policy

  checkEnrollmentEligibility: function(studentData, targetCourseLevel, previousLevelResults) {
    // studentData: { current_mustawa: N, ... }
    // previousLevelResults: Array of { final_point: X, status: 'PASSED'/'FAILED' } for Level N-1

    // Rule 1: Single Level Policy
    // We assume the student is promoted to the next level only if they passed the previous.
    // So if they are in Level 2, they can only take Level 2 courses.
    // However, the spec says: "Pendaftaran Mustawa N+1 hanya dibuka jika seluruh mata kuliah di Mustawa N berstatus LULUS"

    // Check if previous level is fully passed
    var allPassed = true;
    if (previousLevelResults && previousLevelResults.length > 0) {
        for (var i = 0; i < previousLevelResults.length; i++) {
            if (previousLevelResults[i].final_point < 3.0) {
                allPassed = false;
                break;
            }
        }
    } else {
        // If no results for previous level (and level > 1), assume not passed?
        // Or if Level 1, it's always open.
        if (targetCourseLevel > 1) allPassed = false;
        if (targetCourseLevel === 1) allPassed = true;
    }

    if (!allPassed) {
        return { allowed: false, reason: "Harus lulus semua mata kuliah di Mustawa sebelumnya." };
    }

    return { allowed: true };
  }
};

if (typeof module !== "undefined") {
  module.exports = Courses;
}
