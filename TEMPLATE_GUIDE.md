# Panduan Penggunaan Template (TEMPLATE_GUIDE.md)

Dokumen ini menjelaskan cara menggunakan source code ini sebagai template untuk project baru atau batch baru.

## 1. Persiapan Database (Google Sheets)
Anda membutuhkan sebuah Google Spreadsheet baru.
*   **Buat Spreadsheet baru.**
*   **Buat Sheet User (`data_user`):**
    *   Kolom A: NIM
    *   Kolom B: Nama
    *   Kolom C: Jenis Kelamin
    *   Kolom D: Alamat
    *   Kolom E: Program
    *   Kolom F: Nomor Telepon (Format `62...`)
    *   Kolom G: Angkatan
    *   Kolom H: Tempat Lahir
    *   Kolom I: Tanggal Lahir
*   **Buat Sheet Nilai (Sesuai Mata Kuliah):**
    *   Nama Sheet bebas (misal: `Aqidah`, `Fiqih`), asalkan didaftarkan di Config.
    *   Struktur Sheet: Kolom A harus berisi **NIM**, dan Kolom K (Index 10) harus berisi **Nilai Akhir**.
*   **Buat Sheet Sertifikat (`sertifikat`):**
    *   Biarkan kosong, hanya buat header di baris 1: `Nomor`, `NIM`, `Nama`, `Timestamp`, `URL`.

## 2. Persiapan Template Sertifikat (Google Slides)
*   Buat file Google Slides baru.
*   Desain sertifikat Anda.
*   Gunakan placeholder berikut di dalam text box:
    *   `<<nomor sertifikat>>`
    *   `<<nama>>`
    *   `<<predikat>>`
*   Catat **ID Slide** (ada di URL).

## 3. Konfigurasi Backend (Google Apps Script)
1.  Buka editor Google Apps Script.
2.  Buat file-file script (`Database.gs`, `Service.gs`, `Code.gs`) dengan menyalin isi dari folder `src/`.
3.  **PENTING: Konfigurasi `Config.gs`**
    *   Gunakan isi dari file `src/Config.template.js`.
    *   Ganti `YOUR_SPREADSHEET_ID_HERE` dengan ID Spreadsheet Anda.
    *   Ganti `YOUR_DRIVE_FOLDER_ID_HERE` dengan ID Folder Drive (tempat simpan PDF).
    *   Ganti `YOUR_SLIDE_TEMPLATE_ID_HERE` dengan ID Slide Anda.
    *   Sesuaikan `SHEET_COURSES` dengan nama-nama sheet mata kuliah Anda.
    *   Sesuaikan `CERT_PREFIX` dan `CERT_STATIC_CODE` untuk format nomor sertifikat.

## 4. Konfigurasi Frontend (Widget HTML)
1.  Gunakan file `frontend/widget.template.html`.
2.  Cari dan ganti bagian yang ditandai `[PLACEHOLDER]`:
    *   `[YOUR_LOGO_URL]`: URL logo instansi.
    *   `[YOUR_FOOTER_IMAGE_URL]`: URL background footer.
    *   `[YOUR_ADDRESS]`, `[YOUR_PHONE]`, dll.
    *   Warna tema di `:root { --brand-green: ... }`.
3.  Deploy Backend GAS sebagai **Web App** (Who has access: Anyone).
4.  Copy URL Web App dan paste ke variabel `const GOOGLE_SCRIPT_URL = '...'` di bagian bawah script HTML.
5.  Copy seluruh kode HTML ke widget Elementor/WordPress Anda.
