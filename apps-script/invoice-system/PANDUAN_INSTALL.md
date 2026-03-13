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

## Langkah 3: Membuat File Antarmuka HTML (`Form.html` & `PdfForm.html`)
Anda perlu membuat 2 file HTML.
**File Pertama (Form Input):**
1. Di layar Apps Script, pada panel sebelah kiri di bagian **Files** (File), klik tombol `+` (Add a file).
2. Pilih **HTML**.
3. Beri nama file baru tersebut dengan nama persis: **Form** (huruf F besar, tanpa tanda kutip, dan sistem akan otomatis menambahkan akhiran `.html`).
4. Hapus teks bawaan yang ada di dalam kotak kode tersebut.
5. Buka file `Form.html` dari folder yang saya berikan, salin (**copy**) seluruh isinya, lalu tempel (**paste**) ke dalam file `Form.html` di Apps Script Anda.

**File Kedua (Form Pemrosesan PDF):**
1. Klik lagi tombol `+` (Add a file) dan pilih **HTML**.
2. Beri nama file baru tersebut dengan nama: **PdfForm** (P dan F besar).
3. Hapus teks bawaan yang ada.
4. Buka file `PdfForm.html` yang saya berikan, salin seluruh isinya, dan tempel ke dalam file `PdfForm.html` di Apps Script Anda.
5. Simpan proyeknya (`Ctrl + S`).

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
   - **Template Invoice:** Template desain invoice. Karena "Setup Awal" hanya perlu dijalankan sekali, Anda bisa bebas merombak/kustomisasi desain di Sheet "Template Invoice" ini (mengganti font, warna, menambah border, dll) selama Anda **TIDAK menghapus** kata-kata di dalam tanda kurung kurawal seperti `{{Klien}}` atau `{{NoInvoice}}`.

## Langkah 5: Cara Menggunakan Sistem (Alur 2 Tahap)
Sistem ini memisahkan penginputan data dengan pembuatan PDF agar Anda lebih fleksibel.

**Tahap 1: Memasukkan Data Invoice**
1. Klik menu **Sistem Invoice** > **Buat Invoice Baru**.
2. Isi form lengkap (klien, proyek, nilai proyek, tipe pembayaran/Termin/DP, rincian item layanan, pajak, diskon).
3. Klik **Simpan Data Invoice**. Data akan tersimpan di Sheet `Data Invoice` dan rinciannya di `Detail Item`.
4. Anda dapat memperbarui status pembayaran kapan saja langsung dari Sheet `Data Invoice` di kolom **Status** menggunakan Dropdown (Belum Dibayar, Sebagian, Lunas).

**Tahap 2: Memproses Data Menjadi PDF (A4)**
1. Setelah data tersimpan dan Template sudah Anda pastikan desainnya sesuai, klik menu **Sistem Invoice** > **Proses PDF Invoice**.
2. Sebuah popup akan muncul menampilkan daftar nomor invoice yang **belum memiliki link PDF** di Sheet `Data Invoice`.
3. Pilih nomor invoice tersebut lalu klik **Proses Jadi PDF (A4)**.
4. Sistem akan otomatis:
   - Menyalin desain dari 'Template Invoice' yang sudah Anda kustomisasi.
   - Mengisinya dengan data dari sheet.
   - Mengubahnya menjadi file PDF ukuran A4 dan menyimpannya ke folder Google Drive Anda.
   - Menempelkan Link PDF kembali ke baris invoice tersebut di kolom ujung kanan Sheet `Data Invoice`.

Selesai! Sistem Anda siap digunakan dan Template bebas Anda ubah-ubah tanpa khawatir.