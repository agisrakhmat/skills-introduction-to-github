import tkinter as tk
from tkinter import messagebox, filedialog
import threading
import os
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

        self.is_recording = True
        self.stop_event.clear()
        self.recorded_data = []

        self.label_status.config(text="Status: Merekam...", fg="red")
        self.btn_start.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        self.btn_save.config(state=tk.DISABLED)
        self.btn_overlay.config(state=tk.DISABLED)

        threading.Thread(target=self.recording_loop, daemon=True).start()

    def stop_recording(self):
        if not self.is_recording:
            return
        self.is_recording = False
        self.stop_event.set()

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
                if not self.current_bbox:
                    time.sleep(0.5)
                    continue

                # Hide overlay to avoid capturing it in the screenshot
                # We use root.after to schedule UI updates, but since we need to wait for it,
                # we can't easily do it synchronously from here without complex locking.
                # However, for a simple tool, we can try to rely on the fact that we're
                # taking a screenshot of the *screen*.
                #
                # Issue: interacting with GUI (withdraw/deiconify) from thread is unsafe.
                # Solution: We will rely on the overlay being "mostly" transparent (alpha 0.3).
                # But to get clean text, we really should hide it.
                # Since we can't safely hide/show from this thread synchronously,
                # and we can't block the main thread easily...
                #
                # Alternative: The user just needs to position the window.
                # Maybe we can make the overlay fully transparent (alpha=0.0) during capture?
                # No, alpha applies to whole window.
                #
                # Let's try to just capture. If the text is white and overlay is red/alpha,
                # tesseract might still read it.
                # But the text "AREA REKAM" will be read.
                #
                # BEST FIX: Move the "AREA REKAM" label to the *title bar* or a side panel,
                # and make the central area empty.
                # But the overlay IS the window.
                #
                # Let's just minimize the visual noise in the overlay.
                # Make the label text minimal or non-existent during recording?
                #
                # Better: When 'Start Recording' is clicked, we change the overlay style.
                # We can't easily do that from here.
                #
                # Let's use a workaround:
                # We will accept that we might capture the overlay border/text if we don't hide it.
                # But the review was specific: "Self-Occlusion".
                #
                # Let's try to hide it safely.
                # self.root.after(0, self.overlay.withdraw)
                # time.sleep(0.2) # Wait for animation
                # img = ImageGrab.grab(...)
                # self.root.after(0, self.overlay.deiconify)

                self.root.after(0, lambda: self.overlay.withdraw() if self.overlay else None)
                time.sleep(0.2) # Give Tkinter time to process the hide

                img = ImageGrab.grab(bbox=self.current_bbox)

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
