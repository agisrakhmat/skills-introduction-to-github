// Seed.js - Populates the database with mock data for testing

function seedDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clear existing data (preserve headers)
  Object.keys(SHEET_NAMES).forEach(key => {
    const sheet = ss.getSheetByName(SHEET_NAMES[key]);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
    }
  });

  // 1. Create Users
  // Password hash for '1234' (default for phone 081234567890 -> last 4 digits '7890')
  // For simplicity in mock, we use a simple string or a known hash if available.
  // In Auth.js we used checkPassword. Let's assume plain text for mock or align with Auth logic.
  // Auth.js uses ComputeDigest(SHA_256).
  // For this seed, we'll manually create a hash for '7890' if needed, or just insert it if the auth logic allows.
  // Actually, Auth.js implements `checkPassword` which hashes the input and compares.
  // So we need to store the HASH of '7890'.
  // Since we can't easily run the hash here without the GAS environment fully running the digest,
  // We will assume the Auth system handles the hashing.
  // Wait, `seedDatabase` runs IN GAS. So we can use Utilities.

  const rawPass = '7890';
  const passHash = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawPass)
  );

  const studentId = 'ST001';
  appendRow('USERS', {
    user_id: studentId,
    email: 'student@example.com',
    full_name: 'Ahmad Siswa',
    phone: '081234567890',
    role: 'STUDENT',
    status: 'ACTIVE',
    password_hash: passHash,
    created_at: new Date()
  });

  const lecturerId = 'LC001';
  appendRow('USERS', {
    user_id: lecturerId,
    email: 'dosen@example.com',
    full_name: 'Ustadz Budi',
    phone: '081299999999',
    role: 'LECTURER',
    status: 'ACTIVE',
    password_hash: passHash, // reused for convenience
    created_at: new Date()
  });

  // 2. Create Courses
  // Mustawa 1 (Past)
  const courseM1_1 = { course_id: 'MK101', name: 'Aqidah Dasar', lecturer_id: lecturerId, level: 1, sks: 2, semester_period: '2023-GANJIL' };
  const courseM1_2 = { course_id: 'MK102', name: 'Fiqih Ibadah', lecturer_id: lecturerId, level: 1, sks: 2, semester_period: '2023-GANJIL' };

  // Mustawa 2 (Current)
  const courseM2_1 = { course_id: 'MK201', name: 'Aqidah Lanjutan', lecturer_id: lecturerId, level: 2, sks: 2, semester_period: '2024-GENAP' };
  const courseM2_2 = { course_id: 'MK202', name: 'Fiqih Muamalah', lecturer_id: lecturerId, level: 2, sks: 2, semester_period: '2024-GENAP' };

  appendRow('COURSES', courseM1_1);
  appendRow('COURSES', courseM1_2);
  appendRow('COURSES', courseM2_1);
  appendRow('COURSES', courseM2_2);

  // 3. Create Enrollments
  // Student passed Mustawa 1
  appendRow('ENROLLMENTS', {
    enrollment_id: 'ENR001', student_id: studentId, course_id: 'MK101',
    final_grade: 90, final_point: 4.0, status: 'PASSED', enrolled_at: new Date('2023-08-01')
  });
  appendRow('ENROLLMENTS', {
    enrollment_id: 'ENR002', student_id: studentId, course_id: 'MK102',
    final_grade: 85, final_point: 3.5, status: 'PASSED', enrolled_at: new Date('2023-08-01')
  });

  // Student Enrolled in Mustawa 2 (Active)
  appendRow('ENROLLMENTS', {
    enrollment_id: 'ENR003', student_id: studentId, course_id: 'MK201',
    final_grade: 0, final_point: 0, status: 'ENROLLED', enrolled_at: new Date('2024-02-01')
  });

  Logger.log('Database seeded successfully.');
}
