@echo off
echo.
echo ==================================================
echo   Membangun Screen Translator menjadi file .EXE
echo ==================================================
echo.
echo Langkah 1: Pastikan PyInstaller terinstall...
pip install pyinstaller

echo.
echo Langkah 2: Membuat file .EXE...
echo (Ini mungkin memakan waktu beberapa menit, silakan tunggu...)
echo.

pyinstaller --noconfirm --onefile --windowed --name "ScreenTranslator" --hidden-import=PIL --hidden-import=pytesseract --hidden-import=docx --clean app.py

echo.
echo ==================================================
echo   SELESAI!
echo ==================================================
echo.
echo File aplikasi Anda (ScreenTranslator.exe) ada di dalam folder 'dist'.
echo Anda bisa memindahkan file tersebut ke mana saja.
echo.
echo PENTING:
echo Agar aplikasi bisa berjalan di komputer lain tanpa install Tesseract,
echo copy folder instalasi 'Tesseract-OCR' dan taruh di sebelah file .exe ini.
echo.
pause
