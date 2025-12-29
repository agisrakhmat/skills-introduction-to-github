/**
 * Seeder to populate Mock DB
 */
function seedDatabase() {
  // Clear existing
  MOCK_DB.USERS = [];
  MOCK_DB.COURSES = [];

  // Seed Users
  // Format: [ID, EMAIL, NAME, PHONE, ROLE, STATUS, PASSWORD]
  MOCK_DB.USERS.push([
    'ADM001',
    'admin@diploma.id',
    'Super Admin',
    '628110000000',
    'ADMIN',
    'ACTIVE',
    '0000' // Last 4 digits
  ]);

  MOCK_DB.USERS.push([
    'MHS001',
    'student@diploma.id',
    'Ahmad Student',
    '6281234567890',
    'STUDENT',
    'ACTIVE',
    '7890' // Last 4 digits of 6281234567890
  ]);

  // Seed Courses
  // Format: [ID, NAME, LECTURER_ID, LEVEL, SKS, SEMESTER]
  MOCK_DB.COURSES.push(['CRS101', 'Aqidah Dasar', 'LEC001', 1, 2, '2024-GANJIL']);
  MOCK_DB.COURSES.push(['CRS102', 'Fiqh Ibadah', 'LEC001', 1, 2, '2024-GANJIL']);
  MOCK_DB.COURSES.push(['CRS201', 'Ushul Fiqh', 'LEC002', 2, 2, '2024-GANJIL']);

  console.log('Database seeded with dummy data.');
}
