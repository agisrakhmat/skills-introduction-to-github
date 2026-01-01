# Master Project Specification: Diploma Ilmi LMS

## Project Name: Diploma Ilmi Online Learning Management System
**Version:** 3.1 (Updated Business Rules)
**Role:** Project Manager
**Target Developer:** Jules AI / Tech Team

## 1. Project Overview & Tech Stack

**Tujuan**
Membangun platform LMS pembelajaran 100% daring yang ringan, hemat biaya, dan terintegrasi penuh dengan ekosistem Google. Sistem berfokus pada kedisiplinan akademik berjenjang (Mustawa).

**Teknologi (Tech Stack)**
*   **Database:** Google Sheets (Relational Data Model).
*   **Backend:** Google Apps Script (GAS) - `doGet()` & `doPost()`.
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

Setiap entitas di bawah ini merepresentasikan satu "Tab/Sheet" di Spreadsheet database.

**A. USERS (Pengguna)**
*   `user_id` (PK): String (Unik).
*   `email`: String.
*   `full_name`: String.
*   `phone`: String (Nomor WA).
*   `role`: Enum (STUDENT, LECTURER, FINANCE, ADMIN, ACADEMIC).
*   `status`: Enum (ACTIVE, INACTIVE).
*   `password_hash`: String.
*   *Default Password Logic:* 4 digit terakhir dari phone saat registrasi.

**B. COURSES (Mata Kuliah)**
*   `course_id` (PK): String.
*   `name`: String.
*   `lecturer_id` (FK): Ref ke USERS.
*   `level`: Integer (1, 2, 3, 4, 5, 6) -> Skala Mustawa.
*   `sks`: Integer (Bobot kredit).
*   `semester_period`: String (e.g., 2024-GANJIL).

**C. ENROLLMENTS (KRS/Pendaftaran)**
*   `enrollment_id` (PK): String.
*   `student_id` (FK): Ref ke USERS.
*   `course_id` (FK): Ref ke COURSES.
*   `final_grade`: Float (Nilai Angka 0-100).
*   `final_point`: Float (Nilai Poin 0-4 atau skala sesuai standar).
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
*   *Catatan:* Tidak ada opsi cicilan (Full Payment only).

## 4. Business Logic & Grading Rules (CRITICAL)

Bagian ini adalah "otak" dari sistem perhitungan nilai. Backend wajib mengimplementasikan rumus ini secara presisi.

**A. Logika Nilai Kehadiran (Attendance Logic)**
Sistem harus mengonversi status kehadiran menjadi angka secara otomatis:
*   **HADIR** (Live/Tatap Muka): Nilai 100.
*   **REKAMAN** (Menonton Rekaman): Nilai 80 (Syarat: Izin tapi menonton).
*   **IZIN** (Tanpa Menonton): Nilai 50.
*   **ALPA** (Tidak Mengisi/Absen): Nilai 0.

**B. Rumus Nilai & Syarat Kelulusan**
Komponen Nilai:
`Final Score = (Absensi * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)`

Konversi Predikat (Standar Mumtaz):
Backend harus mengonversi Final Score ke dalam Angka Mutu (Poin) dan Predikat.
*   **Passing Grade:** Nilai Poin minimal adalah 3.0.
*   Jika Poin < 3.0, status kelulusan = GAGAL (Tidak Lulus).

Contoh Skala:
*   90 - 100 : 4.0 (Mumtaz) -> LULUS
*   80 - 89  : 3.0 (Jayyid Jiddan) -> LULUS
*   < 80     : < 3.0 -> GAGAL

Konsekuensi Gagal:
*   Mahasiswa TIDAK mendapatkan sertifikat.
*   Mahasiswa harus Mengulang Semester (Enroll ulang di periode berikutnya).

**C. Aturan Kenaikan Jenjang (Mustawa Logic)**
*   **Single Level Policy:** Mahasiswa hanya boleh mengambil mata kuliah di satu Mustawa pada waktu yang sama. Sistem harus memblokir jika mahasiswa mencoba mengambil MK Mustawa 2 dan Mustawa 3 secara bersamaan.
*   **Sequential Progression:** Pendaftaran Mustawa N+1 hanya dibuka (unlocked) jika seluruh mata kuliah di Mustawa N berstatus LULUS (Passed) dengan nilai poin >= 3. Jika ada MK yang gagal di Mustawa 2, mahasiswa tertahan di Mustawa 2 sampai mengulang dan lulus.

## 5. Frontend Architecture & Sitemap

**Halaman Autentikasi & Publik**
*   `Login_Student.html`: Login Mahasiswa (Email/Phone & Password).
*   `Login_Staff.html`: Login Staff.
*   `Register.html`: Form registrasi. Password otomatis dibuat dari 4 digit terakhir No. WA.

**Halaman Mahasiswa (Student Area)**
*   `Dashboard_Student.html`:
    *   Profile Widget: Nama, Mustawa Saat Ini. Tombol "Edit Profil" (aktif).
    *   Status: Aktif/Tidak Aktif.
    *   Akademik: Ringkasan Nilai & Status Kelulusan per Mustawa.
*   `Course_Room.html`: Materi, Tugas, Presensi. Link ke WhatsApp Group Mata Kuliah.

**Halaman Staff & Admin**
*   `Dashboard_Lecturer.html`: Input Materi, Tugas, Nilai.
*   `Dashboard_Finance.html`: Verifikasi Pembayaran (Tanpa fitur cicilan).
*   `Dashboard_Admin.html`:
    *   User Management: Termasuk fitur Manual Password Reset.
    *   Academic Settings: Generate Sertifikat (Hanya untuk yang lulus >= 3.0).

## 6. Backend Performance & Optimization (GAS)
*   **Batch Data Processing:** Gunakan `getValues()` dan `setValues()`.
*   **Caching Strategy:** Cache data statis 15-30 menit.
*   **Concurrency Lock:** Wajib pada `doPost` (pendaftaran/submit).

## 7. Security Guidelines
*   **Password Management:**
    *   Default: 4 digit terakhir nomor telepon.
    *   Reset: Dilakukan manual oleh Admin (tidak ada fitur "Lupa Password" otomatis via email).
*   **Validasi Server-Side:** Validasi token dan role di setiap fungsi backend.
*   **Role Guard:** Proteksi fungsi vital (Finance/Admin only).
