# Master Project Specification: Diploma Ilmi LMS

**Project Name:** Diploma Ilmi Online Learning Management System
**Version:** 3.1 (Updated Business Rules)
**Role:** Project Manager
**Target Developer:** Jules AI / Tech Team

## 1. Project Overview & Tech Stack

**Tujuan**
Membangun platform LMS pembelajaran 100% daring yang ringan, hemat biaya, dan terintegrasi penuh dengan ekosistem Google. Sistem berfokus pada kedisiplinan akademik berjenjang (Mustawa).

**Teknologi (Tech Stack)**
*   **Database:** Google Sheets (Relational Data Model).
*   **Backend:** Google Apps Script (GAS) - doGet() & doPost().
*   **Frontend:** HTML5, CSS3, JavaScript (disajikan via GAS HtmlService) menggunakan widget HTML pada elementor versi gratis.
*   **File Storage:** Google Drive (Bukti bayar, tugas, materi, sertifikat).
*   **Komunikasi:** WhatsApp Group (Sistem tidak mengirim notifikasi email/WA otomatis).

## 2. Struktur Organisasi & Pengguna (User Roles)

Sistem harus membedakan akses berdasarkan peran berikut:
*   **Mahasiswa (Student):** Daftar, bayar (penuh), belajar berjenjang, tugas, presensi, edit profil mandiri.
*   **Dosen (Lecturer):** Upload materi, buat tugas, input nilai, monitor presensi.
*   **Staff Keuangan (Finance):** Verifikasi pembayaran masuk.
*   **Staff Akademik (Academic):** Kelola jadwal, kurikulum, generate sertifikat, reset password manual.
*   **Administrator (Super Admin):** Manajemen user penuh, konfigurasi sistem.
*   **Staff Kesiswaan:** Monitoring aktivitas siswa.

## 3. Struktur Database (Google Sheets Schema)

A. **USERS (Pengguna)**
*   `user_id` (PK): String (Unik).
*   `email`: String.
*   `full_name`: String.
*   `phone`: String (Nomor WA).
*   `role`: Enum (STUDENT, LECTURER, FINANCE, ADMIN, ACADEMIC).
*   `status`: Enum (ACTIVE, INACTIVE).
*   `password_hash`: String.
*   *Default Password Logic:* 4 digit terakhir dari phone saat registrasi.

B. **COURSES (Mata Kuliah)**
*   `course_id` (PK): String.
*   `name`: String.
*   `lecturer_id` (FK): Ref ke USERS.
*   `level`: Integer (1, 2, 3, 4, 5, 6) -> Skala Mustawa.
*   `sks`: Integer (Bobot kredit).
*   `semester_period`: String (e.g., 2024-GANJIL).

C. **ENROLLMENTS (KRS/Pendaftaran)**
*   `enrollment_id` (PK): String.
*   `student_id` (FK): Ref ke USERS.
*   `course_id` (FK): Ref ke COURSES.
*   `final_grade`: Float (Nilai Angka 0-100).
*   `final_point`: Float (Nilai Poin 0-4 atau skala sesuai standar).
*   `status`: Enum (ENROLLED, PASSED, FAILED).

D. **ATTENDANCE (Presensi)**
*   `attendance_id` (PK): String.
*   `course_id` (FK): Ref ke COURSES.
*   `student_id` (FK): Ref ke USERS.
*   `session_date`: Date.
*   `status`: Enum (HADIR, REKAMAN, IZIN, ALPA).
*   `points`: Integer.

E. **ASSIGNMENTS (Tugas & Ujian)**
*   `assignment_id` (PK): String.
*   `course_id` (FK): Ref ke COURSES.
*   `type`: Enum (TUGAS, UTS, UAS).
*   `max_score`: Integer.

F. **SUBMISSIONS (Nilai Masuk)**
*   `submission_id` (PK): String.
*   `assignment_id` (FK): Ref ke ASSIGNMENTS.
*   `student_id` (FK): Ref ke USERS.
*   `score`: Float.

G. **PAYMENTS (Keuangan)**
*   `payment_id` (PK): String.
*   `student_id` (FK): Ref ke USERS.
*   `amount`: Decimal.
*   `proof_url`: String (Link GDrive).
*   `status`: Enum (PENDING, VERIFIED, REJECTED).
*   *Catatan:* Tidak ada opsi cicilan (Full Payment only).

## 4. Business Logic & Grading Rules (CRITICAL)

A. **Logika Nilai Kehadiran (Attendance Logic)**
*   HADIR (Live/Tatap Muka): Nilai 100.
*   REKAMAN (Menonton Rekaman): Nilai 80 (Syarat: Izin tapi menonton).
*   IZIN (Tanpa Menonton): Nilai 50.
*   ALPA (Tidak Mengisi/Absen): Nilai 0.

B. **Rumus Nilai & Syarat Kelulusan**
*   **Final Score** = (Absensi x 20%) + (Tugas x 15%) + (UTS x 30%) + (UAS x 35%)
*   **Passing Grade:** Nilai Poin minimal adalah 3.0.
*   **Konversi:**
    *   90 - 100 : 4.0 (Mumtaz) -> LULUS
    *   80 - 89 : 3.0 (Jayyid Jiddan) -> LULUS
    *   < 80 : < 3.0 -> GAGAL
*   **Konsekuensi Gagal:** Tidak dapat sertifikat, harus mengulang semester.

C. **Aturan Kenaikan Jenjang (Mustawa Logic)**
*   **Single Level Policy:** Mahasiswa hanya boleh mengambil mata kuliah di satu Mustawa pada waktu yang sama.
*   **Sequential Progression:** Pendaftaran Mustawa N+1 hanya dibuka jika seluruh mata kuliah di Mustawa N berstatus LULUS (Passed) dengan nilai poin >= 3.

## 5. Frontend Architecture & Sitemap
*   **Login_Student.html**
*   **Login_Staff.html**
*   **Register.html**
*   **Dashboard_Student.html**
*   **Course_Room.html**
*   **Dashboard_Lecturer.html**
*   **Dashboard_Finance.html**
*   **Dashboard_Admin.html**

## 6. Backend Performance & Optimization (GAS)
*   Batch Data Processing.
*   Caching Strategy (15-30 mins).
*   Concurrency Lock on doPost.

## 7. Security Guidelines
*   Password: 4 last digits of phone.
*   Manual Reset by Admin.
*   Server-Side Validation.
*   Role Guard.
