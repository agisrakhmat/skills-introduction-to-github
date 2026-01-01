# Diploma Ilmi LMS Backend

This repository contains the backend code for the Diploma Ilmi Online Learning Management System, built with Google Apps Script (GAS).

## Installation

1.  **Create a Google Sheet:**
    *   Create a new Google Spreadsheet. This will act as your database.
    *   Note the Spreadsheet ID (found in the URL).

2.  **Create a Google Apps Script Project:**
    *   Open the Spreadsheet.
    *   Go to **Extensions > Apps Script**.
    *   This opens the GAS editor.

3.  **Copy Code:**
    *   Copy the content of the files in `src/` to your GAS project.
    *   You can create multiple files (`Code.gs`, `Config.gs`, `Database.gs`, `Auth.gs`) corresponding to the files in `src/`. Note that GAS uses `.gs` extension, but the content is the same as the `.js` files here.
    *   **Important:** Update `Config.gs` with your Spreadsheet ID if you are not using a container-bound script (script created *from* the sheet). If you created the script from the sheet, it should work automatically.

4.  **Setup Database:**
    *   In the GAS editor, select the function `setupDatabase` from the dropdown menu in the toolbar.
    *   Click **Run**.
    *   Grant the necessary permissions when prompted.
    *   This will create the required sheets (USERS, COURSES, etc.) and add a default Admin user.
        *   **Default Admin:** `admin@diplomailmi.com`
        *   **Default Password:** `1234`

5.  **Deploy as Web App:**
    *   Click **Deploy > New Deployment**.
    *   Select type: **Web app**.
    *   Description: `Initial Deploy`.
    *   Execute as: **Me** (your account).
    *   Who has access: **Anyone** (or restricted as needed, but 'Anyone' is needed for public login forms usually, or 'Anyone within organization'). For a public-facing student portal, 'Anyone' allows the frontend to talk to it without Google login prompt interference (handled by your custom auth). *However, be careful with security.*
    *   Click **Deploy**.
    *   Copy the **Web App URL**.

## Frontend Integration

The `frontend/` directory contains example HTML files.

1.  Open `Login_Student.html`.
2.  Replace `'YOUR_GAS_SCRIPT_URL_HERE'` with the Web App URL you just copied.
3.  Embed this HTML into your Elementor page using the **HTML Widget**.

## Development

*   `src/`: Backend code.
*   `frontend/`: Frontend HTML widgets.
*   `tests/`: Local Node.js tests.

To run tests locally:
```bash
node tests/test_auth.js
```
