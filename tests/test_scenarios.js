// tests/test_scenarios.js

console.log('=== STARTING LOCAL TESTS ===');

// 1. Initialize DB
seedDatabase();
console.log('[OK] Database Seeded');

// 2. Test Registration
var regData = {
  fullName: 'Budi Santoso',
  email: 'budi@test.com',
  phone: '6281299998888', // Pwd ends in 8888
  gender: 'MALE'
};
var regResult = registerStudent(regData);
console.log('Register Result:', regResult.success ? 'PASS' : 'FAIL');

if (!regResult.success) {
    console.error('Registration Failed:', regResult);
    // process.exit(1);
}

var budiId = regResult.data.nim;
console.log('New Student NIM:', budiId);

// 3. Test Login
var loginResult = loginUser('6281299998888', '8888');
console.log('Login Result:', loginResult.success ? 'PASS' : 'FAIL');

// 4. Test Grading Logic
// Scenario: Budi takes CRS101 (Level 1)
// Mock Enrollment - index 0
MOCK_DB.ENROLLMENTS.push(['ENR001', budiId, 'CRS101', 0, 0, 'ENROLLED']);

// Mock Activities
// Attendance: 14 meetings, all HADIR (100)
for(var i=0; i<14; i++) {
    MOCK_DB.ATTENDANCE.push(['ATT'+i, 'CRS101', budiId, '2024-01-01', 'HADIR', 100]);
}
// Assignments: 2 tasks, score 90 and 100. Average should be 95?
// Logic in AcademicController: getComponentScore averages all submissions found for assignment type.
// If we have 1 assignment entry 'TUGAS' and 1 submission, score is that submission.
MOCK_DB.ASSIGNMENTS.push(['ASG01', 'CRS101', 'TUGAS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB01', 'ASG01', budiId, 95]);

// UTS: 80
MOCK_DB.ASSIGNMENTS.push(['UTS01', 'CRS101', 'UTS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB_UTS', 'UTS01', budiId, 80]);

// UAS: 85
MOCK_DB.ASSIGNMENTS.push(['UAS01', 'CRS101', 'UAS', 100]);
MOCK_DB.SUBMISSIONS.push(['SUB_UAS', 'UAS01', budiId, 85]);

// Calculate Grade
console.log('--- Calculating Grade ---');
var gradeResult = calculateFinalGrade(budiId, 'CRS101');
console.log('Grade Details:', JSON.stringify(gradeResult.details));
console.log('Final Score:', gradeResult.score);

// Expected:
// Att: 100 * 0.2 = 20
// Tgs: 95 * 0.15 = 14.25
// UTS: 80 * 0.3 = 24
// UAS: 85 * 0.35 = 29.75
// Total: 88.0 -> Point 3.0 (Jayyid Jiddan) -> PASSED

var expectedScore = 88.0;
if (Math.abs(gradeResult.score - expectedScore) < 0.1 && gradeResult.status === 'PASSED') {
    console.log('[PASS] Grading Logic Correct.');
    // Update Enrollment to PASSED manually for next test
    // Find enrollment index
    for(let k=0; k<MOCK_DB.ENROLLMENTS.length; k++){
        if(MOCK_DB.ENROLLMENTS[k][1] == budiId && MOCK_DB.ENROLLMENTS[k][2] == 'CRS101') {
             MOCK_DB.ENROLLMENTS[k][COLUMNS.ENROLLMENTS.STATUS] = 'PASSED';
        }
    }
} else {
    console.error('[FAIL] Grading Logic Incorrect. Expected ~88, got', gradeResult.score);
}

// 5. Test Progression (Mustawa)
console.log('--- Testing Mustawa Logic ---');

// Try enroll Level 2 (Target CRS201 which is Level 2)
// Logic: "Must pass ALL courses in Level (targetLevel - 1)"
// Level 1 courses in Seeder: CRS101, CRS102.
// Budi passed CRS101 (manually set above).
// Budi has NOT passed CRS102.
// So checkLevel2 should be FALSE.

var checkLevel2 = canEnrollInLevel(budiId, 2);
console.log('Can Enroll Level 2 (Should be FALSE):', checkLevel2.allowed);

if (checkLevel2.allowed === false) {
    console.log('[PASS] Sequential Progression Enforced (Blocked because Level 1 incomplete).');
} else {
    console.error('[FAIL] User allowed to skip level!', checkLevel2);
}

console.log('=== TESTS FINISHED ===');
