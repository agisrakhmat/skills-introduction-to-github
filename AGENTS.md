# Business Rules & Configuration

## IDs
- **Spreadsheet ID**: `18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE`
- **Drive Folder ID (Certificates)**: `1nGtD-YdPVZzBtJaS35xXuYUmcDfScMZ4`
- **Slide Template ID**: `1ujtPU4XqFV8n5CKiHcFtz9-wm3w-GYkhe7SDWdZdGbQ`

## Database Schema (Google Sheets)

### `data_user` Sheet
- Col A: NIM (Primary Key)
- Col B: Nama
- Col C: Jenis Kelamin
- Col D: Alamat
- Col E: Program Pembelajaran
- Col F: Nomor Telepon (Controller/Validation)
- Col G: Angkatan (Used for Certificate Number)
- Col H: Tempat Lahir
- Col I: Tanggal Lahir

### Course Sheets
Names: `Aqidah`, `Dakwah`, `Fiqih Syafi'i`, `Fiqih Waris`, `Nahwu`
- Key: NIM (Search for NIM in the sheet)
- Value: Nilai Akhir (Column K)

### `sertifikat` Sheet (Log)
- Col A: Nomor Sertifikat (`Diplim-MSTW-01-[Angkatan]-[XXXX]`)
- Col B: NIM
- Col C: Nama
- Col D: Waktu & Tanggal (Timestamp)
- Col E: Link Sertifikat (URL)

## Grading Logic

### Predicates (Subject & Graduation)
- Score >= 95: **Mumtaz**
- Score >= 85: **Jayyid Jiddan Murtafi**
- Score >= 80: **Jayyid Jiddan**
- Score >= 75: **Jayyid Murtafi'**
- Score >= 60: **Jayyid**
- Score < 60: **Rasib** (Failed/Tidak Lulus - Implicit)

### Graduation Requirement
- Calculate Average of all course scores.
- Condition: Average >= 60.
- If Average < 60: Status Failed, Certificate Locked.

## Certificate Logic
- **Format**: `Diplim-MSTW-01-[Angkatan]-[XXXX]`
- `Angkatan`: Taken from `data_user` Col G.
- `XXXX`: Sequence number of the person accessing/generating (among those who graduated). 4 Digits, padded (e.g., 0001).
- **Process**:
  1. Check if user already has a certificate in `sertifikat` sheet.
  2. If yes, return existing URL.
  3. If no, check graduation status.
  4. If passed, generate new PDF from Slide Template.
  5. Replace placeholders: `<<nomor sertifikat>>`, `<<nama>>`, `<<predikat>>`.
  6. Save PDF to Drive Folder.
  7. Log to `sertifikat` sheet.
  8. Return new URL.

## API Response Format
```json
{
  "status": "success", // or "error"
  "message": "...",    // Optional error message
  "data": {
    "nim": "...",
    "nama": "...",
    "program_pembelajaran": "...",
    "angkatan": "...",
    "alamat": "...",
    "ttl": "Place, Date",
    "status_kelulusan": true, // boolean
    "sertifikat_url": "https://...",
    "nilai": [
      { "no": 1, "nama": "Aqidah", "nilai": "Mumtaz", "mutu": 95, "status": "LL" },
      ...
    ]
  }
}
```
*Note: Status 'LL' (Lulus) vs 'BL' (Belum Lulus) based on score?*
*User spec implied specific status display in frontend table, but didn't specify per-subject pass/fail logic other than the predicate ranges. I will assume score >= 60 is LL.*

## Frontend
- Uses `fetch(url + '?nim=...&phone=...')` (GET Request).
