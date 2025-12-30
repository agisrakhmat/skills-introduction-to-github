# Master Project Specification: Diploma Ilmi LMS

## 1. Project Overview & Tech Stack
**Tujuan**: Membangun platform LMS pembelajaran 100% daring yang ringan, hemat biaya, dan terintegrasi penuh dengan ekosistem Google. Sistem berfokus pada kedisiplinan akademik berjenjang (Mustawa).

**Teknologi (Tech Stack)**:
*   **Database**: Google Sheets (Relational Data Model). ID: `1Z9KWRPIox8hAyDEQ7LjKoaQklzH8Ni1JFxGEe8s7aFA`
*   **Backend**: Google Apps Script (GAS) - doGet() & doPost().
*   **Frontend**: HTML5, CSS3, JavaScript (disajikan via GAS HtmlService) menggunakan widget HTML pada elementor versi gratis.
*   **File Storage**: Google Drive (Bukti bayar, tugas, materi, sertifikat).
*   **Komunikasi**: WhatsApp Group (Sistem tidak mengirim notifikasi email/WA otomatis).

## 2. Struktur Organisasi & Pengguna (User Roles)
*   **Mahasiswa (Student)**: Daftar, bayar (penuh), belajar berjenjang, tugas, presensi, edit profil mandiri.
*   **Dosen (Lecturer)**: Upload materi, buat tugas, input nilai, monitor presensi.
*   **Staff Keuangan (Finance)**: Verifikasi pembayaran masuk.
*   **Staff Akademik (Academic)**: Kelola jadwal, kurikulum, generate sertifikat, reset password manual.
*   **Administrator (Super Admin)**: Manajemen user penuh, konfigurasi sistem.
*   **Staff Kesiswaan**: Monitoring aktivitas siswa.

## 3. Struktur Database (Google Sheets Schema)
**A. USERS (Pengguna)**
*   `user_id` (PK): String (Unik). Format NIM: `DI.AA.BB.CC.DDD.EEEE`
*   `email`: String.
*   `full_name`: String.
*   `phone`: String (Nomor WA, format 628xxxxxx).
*   `role`: Enum (STUDENT, LECTURER, FINANCE, ADMIN, ACADEMIC).
*   `status`: Enum (ACTIVE, INACTIVE).
*   `password_hash`: String. Default: 4 digit terakhir dari phone saat registrasi.

**B. COURSES (Mata Kuliah)**
*   `course_id` (PK): String.
*   `name`: String.
*   `lecturer_id` (FK): Ref ke USERS.
*   `level`: Integer (1, 2, 3, 4, 5, 6) -> Skala Mustawa.
*   `sks`: Integer.
*   `semester_period`: String (e.g., 2024-GANJIL).

**C. ENROLLMENTS (KRS/Pendaftaran)**
*   `enrollment_id` (PK): String.
*   `student_id` (FK): Ref ke USERS.
*   `course_id` (FK): Ref ke COURSES.
*   `final_grade`: Float (0-100).
*   `final_point`: Float (0-4).
*   `status`: Enum (ENROLLED, PASSED, FAILED).

**D. ATTENDANCE (Presensi)**
*   `attendance_id` (PK): String.
*   `course_id` (FK): Ref ke COURSES.
*   `student_id` (FK): Ref ke USERS.
*   `session_date`: Date.
*   `status`: Enum (HADIR, REKAMAN, IZIN, ALPA).
*   `points`: Integer.

**E. ASSIGNMENTS (Tugas & Ujian)**
*   `assignment_id` (PK): String.
*   `course_id` (FK): Ref ke COURSES.
*   `type`: Enum (TUGAS, UTS, UAS).
*   `max_score`: Integer.

**F. SUBMISSIONS (Nilai Masuk)**
*   `submission_id` (PK): String.
*   `assignment_id` (FK): Ref ke ASSIGNMENTS.
*   `student_id` (FK): Ref ke USERS.
*   `score`: Float.

**G. PAYMENTS (Keuangan)**
*   `payment_id` (PK): String.
*   `student_id` (FK): Ref ke USERS.
*   `amount`: Decimal.
*   `proof_url`: String (Link GDrive).
*   `status`: Enum (PENDING, VERIFIED, REJECTED).

## 4. Business Logic & Grading Rules (CRITICAL)
**A. Logika Nilai Kehadiran (Attendance Logic)**
*   HADIR (Live/Tatap Muka): 100
*   REKAMAN (Menonton Rekaman): 80
*   IZIN (Tanpa Menonton): 50
*   ALPA (Tidak Mengisi/Absen): 0

**B. Rumus Nilai**
`Final Score = (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)`

**C. Syarat Kelulusan**
*   Passing Grade: Nilai Poin minimal **3.0**.
*   Jika Poin < 3.0, status = GAGAL.
*   Skala:
    *   90 - 100 : 4.0 (Mumtaz) -> LULUS
    *   80 - 89  : 3.0 (Jayyid Jiddan) -> LULUS
    *   < 80     : < 3.0 -> GAGAL
*   Gagal = Tidak dapat sertifikat & Mengulang Semester.

**D. Aturan Kenaikan Jenjang (Mustawa Logic)**
*   **Single Level Policy**: Mahasiswa hanya boleh mengambil mata kuliah di satu Mustawa pada waktu yang sama.
*   **Sequential Progression**: Mustawa N+1 hanya unlocked jika seluruh MK di Mustawa N berstatus LULUS.

## 5. Security Guidelines
*   Password Default: 4 digit terakhir nomor telepon.
*   Reset Password: Manual oleh Admin.
*   Validasi Server-Side: Wajib cek token & role.
*   Concurrency Lock: Wajib pada doPost.

## 6. Backend Performance
*   Batch Data Processing: Gunakan `getValues()` dan `setValues()`.
*   Caching Strategy: Cache data statis 15-30 menit.
