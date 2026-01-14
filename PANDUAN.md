# Panduan Instalasi Sistem Cek Nilai & Sertifikat

Berikut adalah panduan langkah demi langkah untuk memasang backend sistem ini di Google Apps Script.

## Persiapan
Pastikan Anda memiliki akses ke file-file berikut (sesuai ID yang Anda berikan):
1.  **Google Spreadsheet Database** (ID: `18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE`)
2.  **Google Slide Template** (ID: `1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ`)
3.  **Folder Google Drive** untuk menyimpan sertifikat (ID: `1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4`)

## Langkah 1: Pasang Script Backend

1.  Buka **Google Spreadsheet Database** Anda.
2.  Di menu atas, klik **Extensions** (Ekstensi) > **Apps Script**.
3.  Akan terbuka tab baru berisi editor kode.
4.  Hapus semua kode yang ada di file `Code.gs` (biasanya `function myFunction() {...}`).
5.  Buka file `src/Code.js` yang saya lampirkan di repository ini.
6.  **Copy** seluruh isinya dan **Paste** ke dalam editor Apps Script.
7.  Tekan `Ctrl + S` atau ikon disket untuk menyimpan. Beri nama proyek, misalnya "API Cek Nilai".

## Langkah 2: Setup Database (PENTING!)

**Lakukan langkah ini agar backend memperbaiki struktur Spreadsheet Anda secara otomatis.**

1.  Di editor Apps Script, perhatikan dropdown function di toolbar (sebelah kanan tombol Debug).
2.  Pilih fungsi bernama `setupDatabase`.
3.  Klik tombol **Run**.
4.  Tunggu hingga selesai (muncul tulisan "Execution completed").
5.  **Cek Spreadsheet Anda**. Sekarang sudah ada sheet `Aqidah`, `Dakwah`, dll dengan header yang benar (NIM di kolom A, Nilai Akhir di kolom K).
6.  (Opsional) Jika Anda ingin melihat contoh data, pilih fungsi `createDummyData` dan klik **Run**.

## Langkah 3: Deploy sebagai Web App

1.  Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2.  Klik ikon roda gigi (Settings) di sebelah "Select type", pilih **Web app**.
3.  Isi konfigurasi berikut:
    *   **Description**: API Cek Nilai v2
    *   **Execute as**: `Me` (email anda@gmail.com) -> *Ini penting agar script bisa akses Drive & Slide atas nama Anda*.
    *   **Who has access**: `Anyone` (Siapa saja) -> *Ini WAJIB agar widget di website bisa mengakses data tanpa user login Google*.
4.  Klik **Deploy**.
5.  Akan muncul jendela "Authorization required". Klik **Review permissions**.
6.  Pilih akun Google Anda. Jika muncul peringatan "Google hasn’t verified this app", klik **Advanced** (Lanjutan) lalu klik **Go to API Cek Nilai (unsafe)**.
7.  Klik **Allow** (Izinkan).
8.  Salin URL yang muncul di bawah tulisan **Web App URL** (akhiran `/exec`).

## Langkah 4: Pasang di Website (Frontend)

1.  Buka file `frontend/widget.html` yang saya berikan.
2.  Cari baris kode berikut (sekitar baris 470):
    ```javascript
    const GOOGLE_SCRIPT_URL = 'GANTI_DENGAN_URL_GAS_ANDA_DI_SINI';
    ```
3.  Ganti teks `GANTI_DENGAN_URL_GAS_ANDA_DI_SINI` dengan **URL Web App** yang Anda salin di Langkah 3.
4.  Copy seluruh kode HTML tersebut.
5.  Masuk ke Wordpress > Edit halaman dengan Elementor.
6.  Tarik widget **HTML** ke halaman.
7.  Paste kode tersebut.
8.  Simpan/Publish.

## Catatan Penting
*   **Isi Data**: Pastikan Anda mengisi data Nilai Mahasiswa di kolom K (Nilai Akhir) pada setiap sheet mata kuliah.
*   **Format Nomor HP**: Input user `0812...` akan otomatis dibaca `62812...` oleh sistem.
