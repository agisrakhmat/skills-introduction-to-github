# Backend Diploma Ilmi LMS (Google Apps Script)

Ini adalah kode backend untuk sistem LMS Diploma Ilmi. Kode ini ditulis dalam Google Apps Script (GAS) dan menggunakan Google Sheets sebagai database.

## Cara Instalasi

### 1. Persiapan Google Sheets
1. Buat Spreadsheet baru di Google Drive.
2. Salin **ID Spreadsheet** dari URL.
   - Contoh URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjGMUUqPTvl/edit`
   - ID adalah bagian acak antara `/d/` dan `/edit`.
3. Simpan ID ini.

### 2. Persiapan Google Apps Script
1. Di Spreadsheet yang baru dibuat, klik menu **Extensions** > **Apps Script**.
2. Editor GAS akan terbuka.

### 3. Menyalin Kode
Anda perlu membuat 6 file script (`.gs`) di editor GAS dan menyalin kode dari folder `src/` repository ini ke dalamnya.

1. **Config.gs**:
   - Buat file baru bernama `Config.gs`.
   - Copy isi dari `src/Config.gs`.
   - **PENTING**: Ganti `REPLACE_WITH_YOUR_SPREADSHEET_ID` dengan ID Spreadsheet anda.

2. **Setup.gs**:
   - Buat file baru bernama `Setup.gs`.
   - Copy isi dari `src/Setup.gs`.

3. **Database.gs**:
   - Buat file baru bernama `Database.gs`.
   - Copy isi dari `src/Database.gs`.

4. **Auth.gs**:
   - Buat file baru bernama `Auth.gs`.
   - Copy isi dari `src/Auth.gs`.

5. **BusinessLogic.gs**:
   - Buat file baru bernama `BusinessLogic.gs`.
   - Copy isi dari `src/BusinessLogic.gs`.

6. **Code.gs**:
   - Buat file baru bernama `Code.gs` (biasanya sudah ada default, timpa saja isinya).
   - Copy isi dari `src/Code.gs`.

### 4. Setup Database Otomatis
1. Di editor GAS, pastikan file `Setup.gs` tersimpan.
2. Di toolbar atas, pilih fungsi `setupDatabase` dari menu dropdown fungsi.
3. Klik tombol **Run** (Jalankan).
4. Berikan izin (Authorization) jika diminta.
5. Script akan membuat Tab/Sheet yang diperlukan (USERS, COURSES, dll) beserta kolom-kolomnya secara otomatis.

### 5. Deploy sebagai Web App
Untuk menghubungkan backend ini dengan Frontend (Elementor):
1. Klik tombol **Deploy** > **New deployment**.
2. Pilih type **Web app**.
3. Description: "Versi 1".
4. Execute as: **Me** (email anda).
5. Who has access: **Anyone** (agar bisa diakses dari website Elementor).
6. Klik **Deploy**.
7. Salin **Web App URL**. URL ini yang akan digunakan di kode JavaScript frontend anda untuk `fetch`.

## API Endpoints

URL Web App anda mendukung fungsi berikut:

### POST Requests

Format body JSON:
```json
{
  "action": "ACTION_NAME",
  "token": "USER_TOKEN", // Didapat setelah Login (kecuali action 'login' dan 'register')
  ...parameters
}
```

1. **Login**
   - Action: `login`
   - Params: `emailOrPhone`, `password`
   - **Response**: Mengembalikan `token` yang **wajib** disimpan dan dikirim di request selanjutnya.

2. **Register Student**
   - Action: `register`
   - Params: `email`, `full_name`, `phone`

3. **Enroll (KRS)** (Butuh Token)
   - Action: `enroll`
   - Params: `student_id`, `course_id`
   - *Catatan: Mahasiswa hanya bisa mendaftarkan diri sendiri.*

4. **Hitung Nilai (Calculate Grade)** (Butuh Token Admin/Dosen)
   - Action: `calculateGrade`
   - Params: `enrollment_id`

### GET Requests
- `?action=getCourses`: Mendapatkan daftar mata kuliah.
- `?action=getProfile&student_id=XXX&token=USER_TOKEN`: Mendapatkan profil user (Butuh Token).

## Aturan Bisnis & Keamanan (Sudah Terimplementasi)
- **Password**: Default 4 digit terakhir No WA.
- **Keamanan**: Menggunakan Token untuk validasi login. Akses dikontrol berdasarkan Role (misal: Mahasiswa tidak bisa melihat profil orang lain).
- **Nilai**:
  - Absensi 20% (Hadir 100, Rekaman 80, Izin 50, Alpa 0).
  - Tugas 15%.
  - UTS 30%.
  - UAS 35%.
- **Kelulusan**:
  - Poin Minimal 3.0 (Nilai >= 80).
  - Jika gagal, status FAILED.
- **Mustawa**:
  - Single Level Policy: Tidak bisa ambil mata kuliah beda level sekaligus.
  - Sequential Progression: Harus lulus semua MK level N sebelum ambil level N+1. (Support Mengulang/Retake).
