# Master Project Document: LMS Diploma Ilmi

**Project Manager:** AI Assistant
**Client:** Diploma Ilmi
**Tech Stack:** WordPress (Elementor HTML Widget), Google Apps Script (Backend API), Google Sheets (Database).

## 1. Arsitektur Sistem

Sistem ini menggunakan konsep Serverless sederhana.
- **Client Side:** Kode HTML/JS yang ditanam di WordPress mengirim request (AJAX/Fetch) ke URL Web App Google Apps Script.
- **Server Side:** Google Apps Script menerima request (doPost), memproses logika (Login, CRUD, Kalkulasi), dan membaca/menulis ke Google Sheets.
- **Database:** Spreadsheet dengan multiple Tabs (Worksheets).

## 2. Struktur Database (Google Sheets)

Backend AI harus membuat Tab berikut dalam 1 Spreadsheet:

### USERS_MAHASISWA
Kolom: `NIM` (PK), `Nama`, `Email`, `NoWA`, `Password`, `Gender`, `TahunAngkatan`, `KodeAngkatan`, `Status` (ADM/FAA/RGR/RPL), `Mustawa_Saat_Ini`, `Tgl_Daftar`, `Status_Aktif`, `Alamat`, `Tgl_Lahir`, `Status_S1`, `NIM_Lama`.

### USERS_STAFF
Kolom: `Kode_Staff` (PK), `Nama`, `Email`, `Role` (Akademik/Keuangan/Kesiswaan/Dosen/SuperAdmin), `Password`, `NoWA`.

### MATAKULIAH
Kolom: `Kode_MK` (PK), `Nama_MK`, `Mustawa` (01-06), `SKS`, `Dosen_Pengampu` (FK ke Staff).

### JADWAL_KULIAH
Kolom: `ID_Jadwal`, `Kode_MK`, `Hari`, `Jam_Mulai`, `Jam_Selesai`, `Link_Zoom`, `Link_Youtube`.

### PRESENSI
Kolom: `ID_Presensi`, `NIM`, `Kode_MK`, `Pertemuan_Ke`, `Status_Hadir` (Hadir/Live/Rekaman/Izin/Sakit/Absen), `Nilai_Absen`, `Tanggal`, `Bukti_Izin` (Link Drive).

### NILAI_AKADEMIK
Kolom: `ID_Nilai`, `NIM`, `Kode_MK`, `Nilai_Absen` (Rata-rata), `Nilai_Latihan`, `Nilai_UTS`, `Nilai_UAS`, `Nilai_Akhir`, `Predikat`, `Status_Lulus`.

### TRANSAKSI_KEUANGAN
Kolom: `Kode_Trans` (PK), `NIM`, `Jenis_Transaksi`, `Nominal`, `Bukti_Transfer` (Link Drive), `Status_Verifikasi`, `Tgl_Input`, `Tgl_Verifikasi`, `Petugas_Verifikator`, `Komitmen_Bayar`.

### PENGUMUMAN
Kolom: `Kode_Pengumuman` (PK), `Judul`, `Isi_Pesan`, `Link_Gambar_Slide`, `Target_Role`, `Tgl_Terbit`, `Pembuat`.

### SERTIFIKAT
Kolom: `Kode_Sertifikat` (PK), `NIM`, `Jenis_Sertifikat`, `Mustawa_Lulus`, `Tgl_Terbit`, `Link_File_PDF`.

## 3. Logika Bisnis & Formula

### A. Generator Kode Unik (Auto-Numbering)
- **NIM:** `DI.{GENDER}.{TAHUN}.{ANGKATAN}.{STATUS}.{SEQ_4_DIGIT}`
  - Gender: IN (Laki), AT (Perempuan).
  - Status: RGR, FAA, RPL, ADM.
- **Kode Staff:** `DI.{ROLE_CODE}.{SEQ_3_DIGIT}`
  - Role Code: SA (Akademik), SKEU (Keuangan), SK (Kesiswaan), DS (Dosen), ADM (SuperAdmin).
- **Kode MK:** `MK.{MUSTAWA_2_DIGIT}.{INITIAL_3_CHAR}`
- **Kode Transaksi:** `KEU.{JENIS_3_CHAR}.{TAHUN}.{BULAN}.{SEQ_4_DIGIT}`
- **Kode Sertifikat:** `DI.SRFT.{TAHUN}.{BULAN}.{SEQ_4_DIGIT}`
- **Kode Pengumuman:** `KES.{JENIS_3_CHAR}.{TAHUN}.{BULAN}.{SEQ_4_DIGIT}`

### B. Pembobotan Nilai (Grading)
- **Poin Kehadiran:**
  - Zoom/Live Streaming = 100
  - Rekaman = 90
  - Izin/Sakit = 60
  - Absen = 0
- **Rumus Nilai Akhir MK:** `(Rata2_Absensi * 15%) + (Rata2_Tugas * 15%) + (UTS * 30%) + (UAS * 40%)`
- **Predikat (IF Logic):**
  - 100: Mumtaz Murtafi’
  - 90-99: Mumtaz
  - 80-89: Jayyid Jiddan
  - 70-79: Jayyid
  - 60-69: Rasib (Lulus)
  - 0-59: Maqbul (Gagal)

## 4. Keamanan & Akses
- **Password:** Hash SHA-256.
- **Default Password Mahasiswa:** 4 Digit terakhir No WA.
- **Role Verification:** Validasi role user pada setiap request backend.

## 5. Fitur Dashboard (Rencana)
1. **Login:** Mahasiswa & Staff (Role based redirect).
2. **Pendaftaran:** Form lengkap dengan upload bukti & PDF generation.
3. **Dashboard Mahasiswa:** Akademik (Nilai/Jadwal), Tugas (Upload/Quiz), Keuangan, Profil, Pengumuman.
4. **Dashboard Dosen:** Input Nilai & Presensi per MK.
5. **Dashboard Staff Keuangan:** Verifikasi Transaksi.
6. **Dashboard Super Admin:** CRUD User & Master Data.
7. **Verifikasi Sertifikat:** Cek validitas ijazah/sertifikat.
