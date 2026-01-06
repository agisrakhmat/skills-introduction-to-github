// --- Config.js ---
// In GAS, this file should load first or be accessible globally.
// We use a self-executing check for Node.js environment.

var Config = {
  APP_NAME: "LMS Diploma Ilmi",
  // Placeholder ID, user will replace this or we use the active one
  SPREADSHEET_ID: "18_VYfJHfwK3hDSaFT6bkQYSzQS1MScEbLuUd0wPuAEE",

  // Folder IDs (Placeholders)
  FOLDERS: {
    BUKTI_TRANSFER: "FOLDER_ID_BUKTI_TRANSFER", // User must replace this
    SERTIFIKAT: "FOLDER_ID_SERTIFIKAT",
    MATERI: "FOLDER_ID_MATERI"
  },

  // Role Definitions
  ROLES: {
    SUPER_ADMIN: "Super Admin",
    STAFF_KEUANGAN: "Staff Keuangan",
    STAFF_AKADEMIK: "Staff Akademik",
    STAFF_KESISWAAN: "Staff Kesiswaan",
    DOSEN: "Dosen",
    MAHASISWA: "Mahasiswa"
  },

  // Sheet Names
  SHEETS: {
    USERS_MAHASISWA: "USERS_MAHASISWA",
    USERS_STAFF: "USERS_STAFF",
    MATAKULIAH: "MATAKULIAH",
    JADWAL: "JADWAL_KULIAH",
    PRESENSI: "PRESENSI",
    NILAI: "NILAI_AKADEMIK",
    TRANSAKSI: "TRANSAKSI_KEUANGAN",
    PENGUMUMAN: "PENGUMUMAN_SLIDE",
    SERTIFIKAT: "SERTIFIKAT"
  },

  // Predicates
  PREDICATES: {
    MUMTAZ_MURTAFI: { min: 100, max: 100, label: "Mumtaz Murtafi'" },
    MUMTAZ: { min: 90, max: 99, label: "Mumtaz" },
    JAYYID_JIDDAN: { min: 80, max: 89, label: "Jayyid Jiddan" },
    JAYYID: { min: 70, max: 79, label: "Jayyid" },
    RASIB: { min: 60, max: 69, label: "Rasib" }, // Passing
    MAQBUL: { min: 0, max: 59, label: "Maqbul" } // Failing
  }
};

// Node.js Export
if (typeof module !== 'undefined') module.exports = Config;
