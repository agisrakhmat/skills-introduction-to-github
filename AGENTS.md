# Diploma Ilmi LMS - Developer Guidelines

## 1. Business Logic Rules (CRITICAL)

### A. Attendance (Presensi)
The system automatically converts attendance status to points:
- **HADIR** (Live): 100
- **REKAMAN** (Recorded Session): 80
- **IZIN** (Permission): 50
- **ALPA** (Absent): 0

### B. Grading Formula
Final Score Calculation:
$$Final Score = (Attendance \times 20\%) + (Assignment \times 15\%) + (UTS \times 30\%) + (UAS \times 35\%)$$

### C. Passing Grade & Predicate
- **Passing Point:** >= 3.0 (Scale 4.0)
- **Passing Score:** >= 80 (approximate, based on point conversion)
- **Conversion:**
  - 90 - 100 : 4.0 (Mumtaz/Lulus)
  - 80 - 89  : 3.0 (Jayyid Jiddan/Lulus)
  - < 80     : < 3.0 (Gagal)
- **Consequence of Failure:**
  - No Certificate.
  - Must retake the semester/course.

### D. Mustawa Progression (Jenjang)
1. **Single Level Policy:** Student can only enroll in courses of *one* Mustawa level at a time.
2. **Sequential Progression:**
   - To unlock Level $N+1$, the student must have **PASSED** (Point >= 3.0) **ALL** courses in Level $N$.

## 2. Database Schema (Google Sheets)

- **USERS:** `user_id`, `email`, `full_name`, `phone`, `role`, `status`, `password_hash`
- **COURSES:** `course_id`, `name`, `lecturer_id`, `level` (Mustawa), `sks`, `semester_period`
- **ENROLLMENTS:** `enrollment_id`, `student_id`, `course_id`, `final_grade`, `final_point`, `status`
- **ATTENDANCE:** `attendance_id`, `course_id`, `student_id`, `session_date`, `status`, `points`
- **ASSIGNMENTS:** `assignment_id`, `course_id`, `type`, `max_score`
- **SUBMISSIONS:** `submission_id`, `assignment_id`, `student_id`, `score`
- **PAYMENTS:** `payment_id`, `student_id`, `amount`, `proof_url`, `status`

## 3. Tech Constraints
- **GAS:** Use `LockService` for `doPost`.
- **Optimization:** Use batch operations (`getValues`, `setValues`).
- **Auth:** Token-based, persisted in Frontend.
