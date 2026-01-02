# AGENTS.md

Dokumen ini berisi aturan bisnis, panduan pengembangan, dan struktur data untuk proyek Diploma Ilmi LMS.

## Aturan Bisnis (Immutable)

1.  **Rumus Nilai Akhir**:
    `Nilai Akhir = (Kehadiran * 20%) + (Tugas * 15%) + (UTS * 30%) + (UAS * 35%)`
2.  **Batas Kelulusan**: Grade Point minimal 3.0 (Skor >= 80).
3.  **Skor Kehadiran**:
    -   HADIR: 100
    -   REKAMAN: 80
    -   IZIN: 50
    -   ALPA: 0
4.  **Kebijakan Level (Mustawa)**: Mahasiswa tidak bisa mengambil mata kuliah di level N+1 sebelum lulus semua mata kuliah di level N.
5.  **Format Telepon**: Harus dinormalisasi menjadi `628xxxxxx`.
6.  **Format NIM**: `DI.AA.BB.CC.DDD.EEEE`
    -   AA: Gender (IN=Pria, AT=Wanita)
    -   BB: Tahun (2 digit)
    -   CC: Batch (2 digit)
    -   DDD: Status (default RGR)
    -   EEEE: Urutan (4 digit)

## Struktur Folder

-   `src/`: Berisi kode backend Google Apps Script (.gs).
-   `frontend/`: Berisi kode widget HTML untuk Elementor.
-   `tests/`: Berisi script testing lokal (Node.js).

## Database Schema (Google Sheets)

Header berikut **wajib** ada di baris pertama setiap Sheet.

**Users**
`User_ID`, `NIM`, `Email`, `Password_Hash`, `Full_Name`, `TTL`, `Gender`, `Address`, `Phone`, `Old_NIM`, `Status_S1`, `Role`, `Status`, `Batch`, `Bank_Account`, `Created_By`, `Created_At`

**Courses**
`Course_ID`, `Course_Name`, `Course_Code`, `Description`, `Credits`, `Academic_Period`, `Created_At`

**Enrollments**
`Enrollment_ID`, `User_ID`, `Course_ID`, `Academic_Period`, `Status`, `Enrollment_Date`, `Final_Grade`, `Final_Point`, `Created_At`

**Schedules**
`Schedule_ID`, `Course_ID`, `Day`, `Time_Start`, `Time_End`, `Lecturer`, `Room`, `Academic_Period`

**Lessons**
`Lesson_ID`, `Course_ID`, `Lesson_Title`, `Lesson_Number`, `Content_URL`, `Created_At`

**Assignments**
`Assignment_ID`, `Course_ID`, `Teacher_ID`, `Title`, `Type`, `Instructions`, `Due_Date`, `Category`, `Weight`, `Created_At`

**Submissions**
`Submission_ID`, `Assignment_ID`, `User_ID`, `File_Tugas_URL`, `Text_Answer`, `Student_Note`, `Score`, `Feedback`, `Timestamp`

**Attendance_Student**
`Attendance_ID`, `User_ID`, `Course_ID`, `Week`, `Date`, `Status`, `Score`, `Notes`, `Timestamp`

**Attendance_Teacher**
`Attendance_ID`, `Schedule_ID`, `Teacher_ID`, `Status`, `Attended_At`

**Payments**
`Payment_ID`, `User_ID`, `Type`, `Period`, `Amount`, `Proof_URL`, `Description`, `Status`, `Verified_By`, `Created_At`

**Costs**
`Cost_ID`, `Category`, `Description`, `Amount`, `Date`, `Approved_By`, `Status`

**Payroll**
`Payroll_ID`, `Teacher_ID`, `Month`, `Year`, `Base_Salary`, `Allowance`, `Deduction`, `Status`, `Created_At`

**Grades**
`Grade_ID`, `Enrollment_ID`, `UTS`, `UAS`, `Final_Grade`, `Letter_Grade`, `Grade_Point`, `IPK_Contribution`, `Created_At`, `Updated_At`

**Certificate_Templates**
`Template_ID`, `Name`, `Doc_Type`, `Mustawa_Course`, `File_ID`, `File_Type`, `Active`, `Updated_By`, `Updated_At`

**Certificates_Issued**
`Certificate_No`, `User_ID`, `Student_Name`, `Mustawa_Course`, `IPK`, `Predicate`, `Status`, `Download_URL`, `Issued_At`, `Template_ID`, `Created_By`

**Counters**
`Scope`, `Last_Number`, `Updated_At`

**Perf_Logs**
`Action`, `Duration_ms`, `Timestamp`, `Meta`

## Panduan Pengembang

1.  Selalu gunakan Bahasa Indonesia dalam komentar kode.
2.  Gunakan `Config.gs` untuk menyimpan konstanta global.
3.  Pastikan setiap perubahan state menggunakan `LockService` jika melibatkan concurrency (misal: generate NIM).
