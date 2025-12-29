# Diploma Ilmi LMS - Developer Guidelines

## Business Logic & Rules (CRITICAL)

### 1. Grading Formula (Rumus Penilaian)
Final Score calculated as:
`Final Score = (Attendance * 20%) + (Assignment * 15%) + (UTS * 30%) + (UAS * 35%)`

**Attendance Values:**
- HADIR (Live): 100
- REKAMAN (Recorded): 80
- IZIN (Permission): 50
- ALPA (Absent): 0

**Passing Grade:**
- Minimum Point: 3.0 (Scale 0-4)
- Score < 80 implies Point < 3.0 -> **FAILED (GAGAL)**
- Failed students CANNOT proceed to the next Mustawa.

### 2. Academic Progression (Mustawa Logic)
- **Single Level Policy:** Student can only enroll in ONE Mustawa level at a time.
- **Sequential Progression:** Mustawa N+1 is locked until ALL courses in Mustawa N are PASSED.

### 3. User Management
- **Default Password:** Last 4 digits of the registered phone number.
- **Phone Format:** Must serve as login credential (along with Email/ID).
- **ID Generation:** Auto-generated format `DI.AA.BB.CC.DDD.EEEE` (e.g., `DI.IN.24.01.RGR.0001`).

## Tech Stack Constraints
- **Backend:** Google Apps Script (GAS).
- **Database:** Google Sheets.
- **Frontend:** HTML Widgets (embedded in Elementor).
- **No External Database:** Do NOT try to connect to SQL/NoSQL. Use Sheets API or standard array manipulation.

## File Structure
- `src/*.gs`: Backend logic files.
- `frontend/*.html`: Frontend widget files.
