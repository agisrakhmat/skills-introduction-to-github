// AttendanceService.js

/**
 * Gets data for the Course Room.
 */
function getCourseRoomData(courseId, email) {
  const user = findRow('USERS', 'email', email);
  if (!user) throw new Error('User not found');

  const course = findRow('COURSES', 'course_id', courseId);
  if (!course) throw new Error('Course not found');

  // Verify Enrollment
  const enrollment = queryRows('ENROLLMENTS', r => r.student_id === user.user_id && r.course_id === courseId)[0];
  if (!enrollment) throw new Error('Not enrolled in this course');

  // Get Sessions/Attendance
  // For this project, we assume a fixed set of sessions or generated dynamically.
  // Spec implies "Presensi" table.
  // Let's assume there are 14 sessions (standard) or we fetch from ATTENDANCE table if pre-generated.
  // Or we generate the UI list and check if an attendance record exists.

  // Let's fetch existing attendance records for this student & course
  const existingAttendance = queryRows('ATTENDANCE', r => r.student_id === user.user_id && r.course_id === courseId);
  const attendanceMap = {};
  existingAttendance.forEach(a => attendanceMap[a.session_date] = a);

  // Mock Sessions (usually would come from a SESSIONS table or Course schedule)
  // We'll generate 4 mock sessions for the demo
  const sessions = [
    { id: 1, title: 'Pertemuan 1: Pengantar', date: '2024-02-05', recording_url: 'https://youtube.com/example1' },
    { id: 2, title: 'Pertemuan 2: Bab 1', date: '2024-02-12', recording_url: 'https://youtube.com/example2' },
    { id: 3, title: 'Pertemuan 3: Bab 2', date: '2024-02-19', recording_url: 'https://youtube.com/example3' },
    { id: 4, title: 'Pertemuan 4: Bab 3', date: '2024-02-26', recording_url: 'https://youtube.com/example4' }
  ];

  const sessionData = sessions.map(s => {
    const record = attendanceMap[s.date];
    return {
      ...s,
      status: record ? record.status : 'ABSENT', // Default to ABSENT if no record yet (or OPEN)
      points: record ? record.points : 0
    };
  });

  return {
    course_name: course.name,
    sessions: sessionData
  };
}

/**
 * Records attendance when a student watches a recording.
 * Triggered by frontend "Watch" action.
 */
function submitAttendanceRecording(courseId, sessionDate, email) {
  // Lock mechanism (simple lockService in GAS)
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const user = findRow('USERS', 'email', email);
    if (!user) throw new Error('User invalid');

    // Check if record exists
    const sheet = getSheet('ATTENDANCE');
    const data = sheet.getDataRange().getValues();

    // Find row index
    // Schema: attendance_id, course_id, student_id, session_date, status, points...
    // We need to implement a specific update or append.

    let found = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Index 1: course_id, 2: student_id, 3: session_date
      if (row[1] == courseId && row[2] == user.user_id && row[3] == sessionDate) {
         // Update existing
         found = true;
         // If already HADIR (100), don't downgrade to REKAMAN (80).
         // Only update if current status is missing, ALPA, or IZIN (maybe?).
         // Spec: "REKAMAN (80) (Syarat: Izin tapi menonton)".
         // User said: "sistem akan otomatis memvalidasi dan memberikan nilai... walaupun ada celah."
         // So we just force update to REKAMAN if not HADIR.

         if (row[4] !== 'HADIR') {
           // Update Status (Col 4 -> index 4) and Points (Col 5 -> index 5)
           // row indices are 0-based.
           // sheet.getRange(row, col) is 1-based.
           // i is index in 'data', so row number is i+1.
           sheet.getRange(i + 1, 5).setValue('REKAMAN');
           sheet.getRange(i + 1, 6).setValue(80);
         }
         break;
      }
    }

    if (!found) {
      // Create new record
      const newId = 'ATT-' + Date.now();
      appendRow('ATTENDANCE', {
        attendance_id: newId,
        course_id: courseId,
        student_id: user.user_id,
        session_date: sessionDate,
        status: 'REKAMAN',
        points: 80,
        notes: 'Auto-verified via Recording Link'
      });
    }

    return { success: true, new_status: 'REKAMAN', new_points: 80 };

  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}
