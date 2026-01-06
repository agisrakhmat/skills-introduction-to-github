# Master Project Specification: Diploma Ilmi LMS

## Project Name: Diploma Ilmi Online Learning Management System
**Version:** 3.1
**Role:** Project Manager
**Target Developer:** Jules AI / Tech Team

## 1. Project Overview & Tech Stack
**Tujuan:** Membangun platform LMS pembelajaran 100% daring yang ringan, hemat biaya, dan terintegrasi penuh dengan ekosistem Google.

**Teknologi:**
- Database: Google Sheets (Relational Data Model).
- Backend: Google Apps Script (GAS) - doGet() & doPost().
- Frontend: HTML5, CSS3, JavaScript (via GAS HtmlService).
- File Storage: Google Drive.
- Komunikasi: WhatsApp Group.

## 2. Struktur Database (Google Sheets Schema)
A. **USERS**: user_id, email, full_name, phone, role, status, password_hash.
B. **COURSES**: course_id, name, lecturer_id, level (Mustawa), sks, semester_period.
C. **ENROLLMENTS**: enrollment_id, student_id, course_id, final_grade, final_point, status.
D. **ATTENDANCE**: attendance_id, course_id, student_id, session_date, status, points.
E. **ASSIGNMENTS**: assignment_id, course_id, type, max_score.
F. **SUBMISSIONS**: submission_id, assignment_id, student_id, score.
G. **PAYMENTS**: payment_id, student_id, amount, proof_url, status.

## 3. Business Logic (CRITICAL)
**A. Nilai Kehadiran:**
- HADIR: 100
- REKAMAN: 80
- IZIN: 50
- ALPA: 0

**B. Rumus Nilai:**
`Final Score = (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)`

**C. Passing Grade:**
- Point >= 3.0 (Score >= 80) -> LULUS.
- Point < 3.0 -> GAGAL.

**D. Mustawa Logic:**
- Single Level Policy: Hanya boleh satu level sekaligus.
- Sequential Progression: Level N+1 terbuka jika semua MK di Level N Lulus (Point >= 3.0).

## 4. Security
- Password Default: 4 digit terakhir nomor telepon.
- Reset Password: Manual oleh Admin.
