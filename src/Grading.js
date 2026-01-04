var Grading = {
  /**
   * Calculates the final score and status for an enrollment.
   *
   * Formula:
   * Final Score = (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)
   *
   * Attendance Logic:
   * HADIR = 100, REKAMAN = 80, IZIN = 50, ALPA = 0
   */
  calculateGrade: function(enrollmentId) {
    // 1. Get Enrollment Info
    const enrollments = Database.getTable(SHEET_NAMES.ENROLLMENTS);
    const enrollment = enrollments.find(e => e.enrollment_id === enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const studentId = enrollment.student_id;
    const courseId = enrollment.course_id;

    // 2. Calculate Attendance Score
    const attendanceRecords = Database.getTable(SHEET_NAMES.ATTENDANCE).filter(
      a => a.student_id === studentId && a.course_id === courseId
    );

    let totalAttendanceScore = 0;
    let sessionCount = attendanceRecords.length;

    if (sessionCount > 0) {
      attendanceRecords.forEach(record => {
        let score = 0;
        switch(record.status) {
          case 'HADIR': score = 100; break;
          case 'REKAMAN': score = 80; break;
          case 'IZIN': score = 50; break;
          case 'ALPA': score = 0; break;
          default: score = 0;
        }
        totalAttendanceScore += score;
      });
      // Average attendance score? Or is it cumulative points?
      // "Sistem harus mengonversi status kehadiran menjadi angka secara otomatis"
      // Usually attendance component is average of session scores.
      // Let's assume average.
      totalAttendanceScore = totalAttendanceScore / sessionCount;
    } else {
      totalAttendanceScore = 0;
    }

    // 3. Calculate Assignment, UTS, UAS Scores
    // We need to fetch all assignments for this course and the student's submissions.
    const assignments = Database.getTable(SHEET_NAMES.ASSIGNMENTS).filter(a => a.course_id === courseId);
    const submissions = Database.getTable(SHEET_NAMES.SUBMISSIONS).filter(s => s.student_id === studentId);

    let tugasTotal = 0, tugasCount = 0;
    let utsScore = 0;
    let uasScore = 0;

    assignments.forEach(assign => {
      // Find submission
      const sub = submissions.find(s => s.assignment_id === assign.assignment_id);
      const score = sub ? parseFloat(sub.score) : 0; // 0 if not submitted?

      if (assign.type === 'TUGAS') {
        tugasTotal += score;
        tugasCount++;
      } else if (assign.type === 'UTS') {
        utsScore = score;
      } else if (assign.type === 'UAS') {
        uasScore = score;
      }
    });

    const tugasAvg = tugasCount > 0 ? (tugasTotal / tugasCount) : 0;

    // 4. Final Calculation
    // Final Score = (Absensi x 20%) + (Tugas x 15%) + (UTS x 30%) + (UAS x 35%)
    const finalScore = (totalAttendanceScore * 0.20) +
                       (tugasAvg * 0.15) +
                       (utsScore * 0.30) +
                       (uasScore * 0.35);

    // 5. Determine Predicate and Status
    const result = this.determinePredicate(finalScore);

    // 6. Update Enrollment
    Database.update(SHEET_NAMES.ENROLLMENTS, 'enrollment_id', enrollmentId, {
      final_grade: finalScore,
      final_point: result.point,
      status: result.status // ENROLLED, PASSED, FAILED? Spec says PASSED/FAILED for status in ENROLLMENTS example
    });

    return {
      finalScore: finalScore,
      point: result.point,
      predicate: result.predicate,
      status: result.status
    };
  },

  determinePredicate: function(score) {
    let point = 0.0;
    let predicate = '';
    let status = 'GAGAL'; // Default

    // Spec:
    // 90 - 100 : 4.0 (Mumtaz) -> LULUS
    // 80 - 89  : 3.0 (Jayyid Jiddan) -> LULUS
    // < 80     : < 3.0 -> GAGAL
    // Wait, < 80 is Fail? That seems high.
    // Let's re-read: "Passing Grade: Nilai Poin minimal adalah 3.0. Jika Poin < 3.0, status kelulusan = GAGAL"
    // "Contoh Skala: 90-100: 4.0, 80-89: 3.0, <80: <3.0"
    // Okay, I will follow the example strictly.

    if (score >= 90) {
      point = 4.0;
      predicate = 'Mumtaz';
      status = 'PASSED';
    } else if (score >= 80) {
      point = 3.0;
      predicate = 'Jayyid Jiddan';
      status = 'PASSED';
    } else {
      // Logic for < 80.
      // Usually there are more grades, but spec says < 80 is < 3.0 and FAIL.
      // I'll just calculate a rough point or set to 0/1/2 based on typical logic, but essentially it's FAILED.
      // Let's just say if < 80, point < 3.0.
      if (score >= 70) point = 2.0; // Example
      else if (score >= 60) point = 1.0;
      else point = 0.0;

      predicate = 'Rasib'; // Failed
      status = 'FAILED';
    }

    return { point, predicate, status };
  }
};

// Export
if (typeof module !== 'undefined') {
  module.exports = { Grading };
}
