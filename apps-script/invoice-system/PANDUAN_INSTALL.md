# Panduan Instalasi Sistem Invoice Otomatis di Google Sheets

Berikut adalah panduan lengkap bahasa Indonesia langkah-demi-langkah untuk mengaktifkan sistem invoice otomatis di Google Spreadsheet Anda.

## Langkah 1: Buka Google Spreadsheet
1. Buka Google Spreadsheet baru atau Spreadsheet yang sudah Anda sediakan: [Link Spreadsheet Anda](https://docs.google.com/spreadsheets/d/1Ju9sv2DQYVb6Xk3cVuqAlNfeaJVBqRQV5CmYeO7kJCA/edit).
2. Pada menu bagian atas, klik **Extensions** (Ekstensi) > **Apps Script**. Ini akan membuka tab baru.

## Langkah 2: Menyalin Kode (`Code.gs`)
1. Di layar Apps Script yang baru terbuka, Anda akan melihat file bernama `Code.gs` di sebelah kiri.
2. Hapus semua teks yang ada di dalam kotak kode tersebut.
3. Buka file `Code.gs` dari folder yang saya berikan, salin (**copy**) seluruh isi teks di dalamnya, lalu tempel (**paste**) ke dalam file `Code.gs` di Apps Script Anda.
4. Jangan lupa simpan dengan mengklik icon Disket (Save project) atau menekan `Ctrl + S`.

## Langkah 3: Membuat File Form (`Form.html`)
1. Di layar Apps Script, pada panel sebelah kiri di bagian **Files** (File), klik tombol `+` (Add a file).
2. Pilih **HTML**.
3. Beri nama file baru tersebut dengan nama persis: **Form** (huruf F besar, tanpa tanda kutip, dan sistem akan otomatis menambahkan akhiran `.html`).
4. Hapus teks bawaan yang ada di dalam kotak kode tersebut.
5. Buka file `Form.html` dari folder yang saya berikan, salin (**copy**) seluruh isinya, lalu tempel (**paste**) ke dalam file `Form.html` di Apps Script Anda.
6. Simpan kembali proyeknya (`Ctrl + S`).

## Langkah 4: Menjalankan "Setup Awal"
1. Kembali ke tab **Google Spreadsheet** Anda (tutup saja tab Apps Script jika sudah tersimpan).
2. Segarkan (Refresh) halaman browser Anda (tekan F5).
3. Tunggu beberapa detik, dan perhatikan baris menu di bagian paling atas. Anda akan melihat menu baru bernama **"Sistem Invoice"** di sebelah menu Bantuan (Help).
4. Klik **Sistem Invoice** > **Setup Awal (Buat Sheet)**.
5. **Penting (Hanya di awal):** Karena ini pertama kalinya script dijalankan, Google akan meminta izin keamanan (Authorization).
   - Klik **Continue** (Lanjutkan).
   - Pilih akun Google Anda.
   - Jika muncul peringatan "Google hasn't verified this app", klik **Advanced** (Lanjutan) di bagian bawah kiri.
   - Lalu klik **Go to Untitled project (unsafe)** / **Lanjutkan ke proyek tidak aman**.
   - Klik **Allow** (Izinkan).
6. Setelah diizinkan, klik menu **Sistem Invoice** > **Setup Awal (Buat Sheet)** sekali lagi.
7. Script akan mulai bekerja secara otomatis. Jika berhasil, akan muncul notifikasi "Setup Selesai!", dan Anda akan melihat 3 tab sheet baru muncul di bagian bawah:
   - **Data Invoice:** Tempat menyimpan semua ringkasan tagihan.
   - **Detail Item:** Tempat menyimpan rincian barang/layanan setiap invoice.
   - **Template Invoice:** Template desain invoice Anda yang bisa Anda atur sedikit desainnya jika perlu (jangan ubah kata-kata yang di dalam tanda kurung kurawal `{{seperti_ini}}`).

## Langkah 5: Cara Menggunakan Sistem
1. Untuk membuat tagihan baru, cukup klik menu **Sistem Invoice** > **Buat Invoice Baru**.
2. Sebuah form popup akan muncul. Isi nama klien, proyek, rincian item layanan (bisa tambah banyak baris), pajak (isi angka saja tanpa tanda %), diskon, dll.
3. Klik **Simpan & Buat PDF**.
4. Sistem akan otomatis:
   - Menyimpan datanya di tab 'Data Invoice' dan 'Detail Item'.
   - Memberi nomor tagihan berurutan (contoh: INV-202310-001).
   - Memasukkan data ke template, menghitung total, diskon, dan pajak.
   - Menghasilkan file PDF dan menyimpannya ke folder Google Drive khusus Anda.
   - Menampilkan tautan/link PDF tersebut di popup form dan juga menempelkan link tersebut di Sheet 'Data Invoice'.

Selesai! Sistem Anda siap digunakan.