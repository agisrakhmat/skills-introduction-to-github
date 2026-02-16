import tkinter as tk
from tkinter import messagebox, filedialog
import threading
import os
import sys
import time
from difflib import SequenceMatcher

# Core libraries
from PIL import ImageGrab, Image
import pytesseract
from deep_translator import GoogleTranslator
from docx import Document

class ScreenTranslatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Screen Translator")
        self.root.geometry("500x400")
        self.root.attributes('-topmost', True)

        # State variables
        self.is_recording = False
        self.recorded_data = [] # List of {'original': str, 'translated': str}
        self.stop_event = threading.Event()
        self.record_thread = None
        self.overlay = None
        self.current_bbox = None # Thread-safe bbox storage

        # Start bbox update loop
        self.update_bbox_loop()

        # UI Elements
        # Status Frame
        status_frame = tk.Frame(root)
        status_frame.pack(pady=10)

        self.label_status = tk.Label(status_frame, text="Status: Siap", fg="blue", font=("Arial", 12, "bold"))
        self.label_status.pack()

        # Preview Label (Shows last captured text)
        self.label_preview_orig = tk.Label(root, text="[Menunggu Teks...]",
                                      wraplength=450, fg="gray", font=("Arial", 10))
        self.label_preview_orig.pack(pady=5, padx=10)

        self.label_preview_trans = tk.Label(root, text="[Menunggu Terjemahan...]",
                                      wraplength=450, fg="black", font=("Arial", 11, "bold"))
        self.label_preview_trans.pack(pady=5, padx=10)

        # Buttons Frame
        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=10, fill=tk.BOTH, expand=True)

        self.btn_overlay = tk.Button(btn_frame, text="Tampilkan Bingkai Ajaib", command=self.toggle_overlay, bg="#ffeb3b", font=("Arial", 10))
        self.btn_overlay.pack(pady=5, fill=tk.X, padx=20)

        self.btn_start = tk.Button(btn_frame, text="Mulai Merekam", command=self.start_recording, bg="#d9ffcc", font=("Arial", 10))
        self.btn_start.pack(pady=5, fill=tk.X, padx=20)

        self.btn_stop = tk.Button(btn_frame, text="Berhenti", command=self.stop_recording, state=tk.DISABLED, bg="#ffcccc", font=("Arial", 10))
        self.btn_stop.pack(pady=5, fill=tk.X, padx=20)

        self.btn_save = tk.Button(btn_frame, text="Simpan Hasil", command=self.save_result, bg="#ccf2ff", font=("Arial", 10))
        self.btn_save.pack(pady=5, fill=tk.X, padx=20)

        # Initial Check
        self.check_tesseract_availability()

    def check_tesseract_availability(self):
        """Checks if Tesseract is available in PATH or common locations."""
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.join(os.getenv('LOCALAPPDATA', ''), r'Programs\Tesseract-OCR\tesseract.exe'),
        ]

        # Add portable path (relative to the executable)
        if getattr(sys, 'frozen', False):
            # If running as PyInstaller .exe
            base_path = os.path.dirname(sys.executable)
        else:
            # If running as script
            base_path = os.path.dirname(os.path.abspath(__file__))

        portable_path = os.path.join(base_path, 'Tesseract-OCR', 'tesseract.exe')
        common_paths.insert(0, portable_path) # Prioritize portable version

        # Check if tesseract is in PATH
        if self.is_tesseract_installed():
            return

        # Check common paths
        for path in common_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                if self.is_tesseract_installed():
                    return

        # If not found, ask user
        messagebox.showwarning("Tesseract Tidak Ditemukan",
                               "Aplikasi ini membutuhkan Tesseract OCR.\n"
                               "Jika sudah diinstall, silakan pilih file 'tesseract.exe'.\n"
                               "Jika belum, silakan install terlebih dahulu.")

        path = filedialog.askopenfilename(title="Cari tesseract.exe", filetypes=[("Executables", "*.exe")])
        if path:
            pytesseract.pytesseract.tesseract_cmd = path
            if not self.is_tesseract_installed():
                messagebox.showerror("Error", "File yang dipilih tidak valid atau Tesseract tidak berfungsi.")
        else:
            self.label_status.config(text="Error: Tesseract Missing", fg="red")
            self.btn_start.config(state=tk.DISABLED)

    def is_tesseract_installed(self):
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def toggle_overlay(self):
        if self.overlay:
            self.overlay.destroy()
            self.overlay = None
            self.btn_overlay.config(text="Tampilkan Bingkai Ajaib", bg="#ffeb3b")
        else:
            self.create_overlay()
            self.btn_overlay.config(text="Tutup Bingkai Ajaib", bg="#ffc107")

    def create_overlay(self):
        self.overlay = tk.Toplevel(self.root)
        self.overlay.title("Area Rekam")
        self.overlay.geometry("600x100")
        self.overlay.attributes('-topmost', True)
        self.overlay.attributes('-alpha', 0.3)

        lbl = tk.Label(self.overlay, text="AREA REKAM (GESER KE TEXT)", bg="red", fg="white")
        lbl.pack(fill=tk.X, side=tk.TOP)

        self.overlay.protocol("WM_DELETE_WINDOW", self.toggle_overlay)

    def start_recording(self):
        if not self.overlay:
            messagebox.showwarning("Peringatan", "Harap tampilkan dan posisikan Bingkai Ajaib terlebih dahulu!")
            return

        if self.record_thread and self.record_thread.is_alive():
            return

        self.is_recording = True
        self.stop_event.clear()
        self.recorded_data = []

        self.label_status.config(text="Status: Merekam...", fg="red")
        self.btn_start.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        self.btn_save.config(state=tk.DISABLED)
        self.btn_overlay.config(state=tk.DISABLED)

        self.record_thread = threading.Thread(target=self.recording_loop, daemon=True)
        self.record_thread.start()

    def stop_recording(self):
        if not self.is_recording:
            return
        self.is_recording = False
        self.stop_event.set()

        # Wait for thread to finish (optional, but good practice if not blocking UI)
        # We won't join here to keep UI responsive, but the check in start_recording protects us.

        self.label_status.config(text="Status: Berhenti", fg="blue")
        self.btn_start.config(state=tk.NORMAL)
        self.btn_stop.config(state=tk.DISABLED)
        self.btn_save.config(state=tk.NORMAL)
        self.btn_overlay.config(state=tk.NORMAL)

    def update_bbox_loop(self):
        """Safely updates bbox coordinates from the main thread."""
        if self.overlay:
            try:
                x = self.overlay.winfo_rootx()
                y = self.overlay.winfo_rooty()
                w = self.overlay.winfo_width()
                h = self.overlay.winfo_height()
                self.current_bbox = (x, y, x+w, y+h)
            except Exception:
                self.current_bbox = None
        else:
            self.current_bbox = None

        # Run this check every 500ms
        self.root.after(500, self.update_bbox_loop)

    def update_preview_ui(self, original, translated):
        self.label_preview_orig.config(text=f"EN: {original}")
        self.label_preview_trans.config(text=f"ID: {translated}")

    def recording_loop(self):
        translator = GoogleTranslator(source='auto', target='id')
        last_text = ""

        while not self.stop_event.is_set():
            try:
                # Check for safe bbox
                capture_bbox = self.current_bbox
                if not capture_bbox:
                    time.sleep(0.5)
                    continue

                # Hide overlay to avoid capturing it in the screenshot
                self.root.after(0, lambda: self.overlay.withdraw() if self.overlay else None)
                time.sleep(0.2) # Give Tkinter time to process the hide

                # Use the local variable capture_bbox to prevent race condition
                img = ImageGrab.grab(bbox=capture_bbox)

                self.root.after(0, lambda: self.overlay.deiconify() if self.overlay else None)

                # OCR
                # psm 6 = Assume a single uniform block of text.
                text = pytesseract.image_to_string(img, config='--psm 6').strip()
                text = " ".join(text.split()) # Normalize whitespace

                if not text:
                    time.sleep(1)
                    continue

                # Deduplication
                # Calculate similarity ratio
                similarity = SequenceMatcher(None, last_text, text).ratio()

                # If text is significantly different (similarity < 0.8) and long enough
                if similarity < 0.85 and len(text) > 2:

                    # Translate
                    try:
                        translated = translator.translate(text)

                        # Store
                        self.recorded_data.append({
                            'original': text,
                            'translated': translated
                        })

                        last_text = text

                        # Update UI safely
                        self.root.after(0, lambda o=text, t=translated: self.update_preview_ui(o, t))

                    except Exception as e:
                        print(f"Translation Error: {e}")

                time.sleep(1.5)

            except Exception as e:
                print(f"Loop Error: {e}")
                time.sleep(1)

    def save_result(self):
        if not self.recorded_data:
            messagebox.showinfo("Info", "Belum ada teks yang direkam.")
            return

        file_path = filedialog.asksaveasfilename(defaultextension=".docx",
                                                 filetypes=[("Word Document", "*.docx"), ("Text File", "*.txt")])
        if not file_path:
            return

        try:
            if file_path.endswith(".docx"):
                doc = Document()
                doc.add_heading('Hasil Terjemahan Layar', 0)

                for item in self.recorded_data:
                    p = doc.add_paragraph()
                    run_orig = p.add_run(f"{item['original']}\n")
                    run_orig.italic = True
                    run_orig.font.color.rgb = None # Default

                    run_trans = p.add_run(f"{item['translated']}\n")
                    run_trans.bold = True

                doc.save(file_path)
            else:
                with open(file_path, "w", encoding="utf-8") as f:
                    for item in self.recorded_data:
                        f.write(f"Original: {item['original']}\n")
                        f.write(f"Terjemahan: {item['translated']}\n")
                        f.write("-" * 20 + "\n")

            messagebox.showinfo("Sukses", "File berhasil disimpan!")

        except Exception as e:
            messagebox.showerror("Error", f"Gagal menyimpan file: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ScreenTranslatorApp(root)
    root.mainloop()
