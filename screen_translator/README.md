# Screen Translator (Penerjemah Layar Otomatis)

Aplikasi desktop sederhana untuk merekam teks dari layar (seperti subtitle video atau caption), menerjemahkannya secara otomatis dari Bahasa Inggris ke Bahasa Indonesia, dan menyimpannya ke dalam file Word (.docx) atau Text (.txt).

## Fitur Utama

*   **Bingkai Ajaib (Overlay):** Jendela transparan yang bisa diletakkan di atas area teks (subtitle video, Windows Live Caption, dll).
*   **OCR Otomatis:** Mengubah gambar layar menjadi teks secara real-time.
*   **Penerjemah Instan:** Menerjemahkan teks Inggris ke Indonesia.
*   **Anti-Duplikasi:** Mencegah perekaman kalimat yang sama berulang-ulang.
*   **Ekspor File:** Simpan hasil terjemahan ke format Microsoft Word atau Text.

## Prasyarat (Wajib Diinstall)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstall:

1.  **Python 3.x**: [Download di sini](https://www.python.org/downloads/) (Pastikan centang "Add Python to PATH" saat instalasi).
2.  **Tesseract OCR**: Ini adalah mesin pembaca teks.
    *   **Windows**: Download installer [di sini (ub-mannheim/tesseract)](https://github.com/UB-Mannheim/tesseract/wiki). Pilih versi terbaru (misalnya `tesseract-ocr-w64-setup-....exe`).
    *   **Penting:** Saat menginstall Tesseract, ingat lokasi instalasinya (biasanya di `C:\Program Files\Tesseract-OCR`). Aplikasi akan mencoba mencarinya otomatis, tapi jika gagal, Anda perlu menunjukkannya manual.

## Instalasi

1.  Buka terminal (Command Prompt atau PowerShell) di dalam folder `screen_translator`.
2.  Install pustaka Python yang dibutuhkan dengan perintah:
    ```bash
    pip install -r requirements.txt
    ```

## Cara Menjalankan

Jalankan aplikasi dengan perintah:
```bash
python app.py
```

## Cara Menggunakan

1.  **Buka Aplikasi:** Jendela utama "Screen Translator" akan muncul.
2.  **Tampilkan Bingkai:** Klik tombol **"Tampilkan Bingkai Ajaib"**. Sebuah kotak transparan akan muncul.
3.  **Posisikan Bingkai:** Geser dan ubah ukuran kotak transparan tersebut agar pas menutupi area teks/subtitle yang ingin direkam.
    *   *Tips:* Pastikan hanya teks yang masuk dalam kotak agar hasil lebih akurat.
4.  **Mulai Merekam:** Klik tombol **"Mulai Merekam"**. Status akan berubah menjadi "Merekam...".
    *   Aplikasi akan mulai membaca teks setiap 1-2 detik.
    *   Hasil terjemahan sementara akan muncul di jendela utama.
5.  **Berhenti:** Jika sudah selesai, klik tombol **"Berhenti"**.
6.  **Simpan:** Klik tombol **"Simpan Hasil"** untuk menyimpan semua teks yang terekam ke file `.docx` atau `.txt`.

## Troubleshooting

*   **Error: Tesseract Tidak Ditemukan**
    *   Jika muncul pesan error ini, aplikasi akan meminta Anda memilih file `tesseract.exe`. Cari di folder instalasi Tesseract (biasanya `C:\Program Files\Tesseract-OCR\tesseract.exe`).
*   **Hasil Terjemahan Aneh/Salah**
    *   Pastikan "Bingkai Ajaib" tidak menutupi area yang terlalu luas atau bergambar rumit. Semakin bersih latar belakang teks, semakin akurat hasilnya.
    *   Pastikan font subtitle cukup besar dan jelas.

---
Dibuat dengan Python (Tkinter, Tesseract, Deep Translator).
