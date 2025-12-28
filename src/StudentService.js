// StudentService.js - Backend Logic for Student Dashboard

/**
 * Main function called by the frontend to get all dashboard data.
 * @param {string} email - The user's email (from Session/LocalStorage).
 * @return {Object} The complete dashboard data structure.
 */
function getStudentDashboardData(email) {
  const user = findRow('USERS', 'email', email);
  if (!user || user.role !== 'STUDENT') {
    throw new Error('User not found or access denied.');
  }

  const studentId = user.user_id;
  const enrollments = queryRows('ENROLLMENTS', r => r.student_id === studentId);
  const courses = queryRows('COURSES', () => true); // Fetch all courses for mapping

  // 1. Calculate Mustawa Progress
  const mustawaStatus = calculateMustawaProgress(studentId, enrollments, courses);

  // 2. Prepare Display Data
  return {
    profile: {
      name: user.full_name,
      student_id: user.user_id,
      current_mustawa: mustawaStatus.currentLevel,
      status: user.status
    },
    academic_history: mustawaStatus.history,
    active_courses: mustawaStatus.activeCourses,
    available_courses: mustawaStatus.availableCourses
  };
}

/**
 * Core Logic for Mustawa Progression
 */
function calculateMustawaProgress(studentId, enrollments, allCourses) {
  // Map Course ID to Course Object for easy lookup
  const courseMap = {};
  allCourses.forEach(c => courseMap[c.course_id] = c);

  // Group Enrollments by Mustawa Level
  const levelData = {}; // { 1: { passed: [], failed: [], enrolled: [] }, 2: ... }

  // Initialize levels 1-6
  for(let i=1; i<=6; i++) levelData[i] = { passed: [], failed: [], enrolled: [], total_courses: 0 };

  // Count total courses per level from allCourses
  allCourses.forEach(c => {
    if (levelData[c.level]) {
      levelData[c.level].total_courses++;
    }
  });

  // Process Student Enrollments
  enrollments.forEach(enr => {
    const course = courseMap[enr.course_id];
    if (!course) return; // Skip if course data missing

    const lvl = course.level;
    const status = enr.status; // PASSED, FAILED, ENROLLED

    if (status === 'PASSED') {
      levelData[lvl].passed.push(course);
    } else if (status === 'FAILED') {
      levelData[lvl].failed.push(course);
    } else if (status === 'ENROLLED') {
      levelData[lvl].enrolled.push({
        ...course,
        enrollment_id: enr.enrollment_id
      });
    }
  });

  // Determine "Current Level" and History
  // Rule: Mustawa N is "Complete" if passed.length == total_courses (simplified)
  // Or simpler: We look for the highest level where they have "ENROLLED" courses.
  // Or if no enrolled courses, the highest completed level + 1.

  let currentLevel = 1;
  let history = [];
  let activeCourses = [];

  // Check levels 1 to 6
  for (let i = 1; i <= 6; i++) {
    const d = levelData[i];
    const isComplete = (d.passed.length === d.total_courses) && d.total_courses > 0;
    const hasActive = d.enrolled.length > 0;
    const hasFailed = d.failed.length > 0;

    let statusLabel = 'LOCKED';
    if (isComplete) statusLabel = 'PASSED';
    else if (hasActive) statusLabel = 'ACTIVE';
    else if (hasFailed) statusLabel = 'FAILED'; // Though user says failed data is deleted usually

    // Logic for "Current Level":
    // If we find an 'ACTIVE' level, that is the current one.
    // If we find a 'PASSED' level, we continue checking next.
    // If we find 'LOCKED' (and previous was passed), this is the *next* candidate (unless we are enrolled in it).

    if (hasActive) {
      currentLevel = i;
      activeCourses = d.enrolled;
    } else if (isComplete) {
       // Just history, potential to move to next
       // If level i is complete, current might be i+1 (checked in next iteration)
       currentLevel = i + 1;
    }

    history.push({
      level: i,
      status: statusLabel,
      passed_count: d.passed.length,
      total_count: d.total_courses
    });
  }

  // Correction: If user is enrolled in Lvl 2, loop sets currentLevel=2.
  // If user passed Lvl 1, loop sets currentLevel=2 at i=1 iteration, then overrides at i=2 if active.

  // Available Courses for Next Level logic
  // If currentLevel is X, and no active courses, show available courses for X.
  // If active courses exist, user is "in" that level.
  // Single Level Policy: Can't take courses from other levels.

  let availableCourses = [];

  // If we are not actively enrolled in anything, we look at the calculated currentLevel.
  // We should list courses for that level that are NOT yet passed.
  const targetLevel = currentLevel;

  // Filter courses for targetLevel that are not in passed/enrolled
  if (targetLevel <= 6) {
    const enrolledIds = enrollments.map(e => e.course_id);
    availableCourses = allCourses.filter(c =>
      c.level === targetLevel && !enrolledIds.includes(c.course_id)
    );
  }

  return {
    currentLevel,
    history,
    activeCourses,
    availableCourses
  };
}
