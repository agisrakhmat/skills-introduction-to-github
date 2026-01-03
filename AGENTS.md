# AGENTS.md - Diploma Ilmi LMS

## Project Overview
This project is a Learning Management System (LMS) for an online campus.
- **Backend**: Google Apps Script (GAS).
- **Database**: Google Sheets.
- **Frontend**: HTML/CSS/JS served via GAS `HtmlService` (embedded in Elementor).

## Directory Structure
- `src/`: Backend Google Apps Script files (.gs / .js).
- `frontend/`: Frontend HTML files (.html).
- `tests/`: Local Node.js test scripts.

## Coding Conventions
1.  **Environment Compatibility**: Code must run in both Google Apps Script (ES5/ES6 features supported by GAS V8) and Node.js.
    -   Use `var MyModule = { ... }` pattern for modules.
    -   Use conditional exports at the end of files:
        ```javascript
        if (typeof module !== 'undefined' && module.exports) {
          module.exports = MyModule;
        }
        ```
2.  **Language**:
    -   Code comments and variable names: English.
    -   **User Communication**: **INDONESIAN (Bahasa Indonesia)** only.
3.  **Database Access**:
    -   Minimize calls to `SpreadsheetApp`.
    -   Use `range.getValues()` and `range.setValues()` for batch processing.
    -   Implement Caching (CacheService) for read-heavy data (15-25 minutes).
    -   Use `LockService` for write operations to prevent race conditions.

## Business Rules (Critical)

### Grading
-   **Formula**: `Final Score = (Attendance * 20%) + (Assignment * 15%) + (UTS * 30%) + (UAS * 35%)`
-   **Attendance Values**:
    -   HADIR (Live): 100
    -   REKAMAN (Recorded): 80
    -   IZIN (Permission): 50
    -   ALPA (Absent): 0
-   **Passing Grade**:
    -   Point >= 3.0 (Score >= 80).
    -   If < 3.0, Status = FAILED (GAGAL).

### Academic Progression
-   **Single Level Policy**: Student can only enroll in courses of their current Mustawa level.
-   **Sequential Progression**: Must pass ALL courses in Level N to unlock Level N+1.

### Authentication
-   **Password**: SHA-256 hash.
    -   Default: Last 4 digits of phone number.
-   **Token**: HMAC SHA-256 signed token.
-   **Session**: Persist token and user object in `localStorage` (`lms_token`, `lms_user`).

## Security
-   **Validation**: Validate Token and Role on every protected endpoint.
-   **File Uploads**:
    -   Store in Google Drive.
    -   Naming: `[ID]_[FeatureDescription]_[Date]`.
    -   Return URL.

## Deployment
-   Copy content of `src/` to Google Apps Script project.
-   `doPost` routes requests based on `action` parameter.
