
if (typeof Config === 'undefined') {
  var Config = require('./Config.js');
}
if (typeof Database === 'undefined') {
  var Database = require('./Database.js');
}

var Auth = {
  // Login Logic
  login: function(identifier, password, role) {
    var sheetName = (role === 'Mahasiswa') ? Config.SHEET_NAMES.USERS_MAHASISWA : Config.SHEET_NAMES.USERS_STAFF;
    var idCol = (role === 'Mahasiswa') ? "Email" : "Email"; // Both use Email for login usually, or ID for staff?
    // Frontend says: "Username / Email / NIM" for student. "ID Pegawai / Email" for staff.

    // We will search both columns if possible or just Iterate.
    // Since we use Database.getAll(), we have the data in memory.

    var users = Database.getAll(sheetName);
    var user = null;

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        // Check Identifier (Email or NIM/ID)
        var matchId = (String(u[idCol]) === String(identifier)) || (String(u['NIM'] || u['ID_Staff']) === String(identifier));

        if (matchId) {
            // Verify Password
            // In a real app, use Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
            // For now, we assume plain text match or simple hash for simulation context if needed.
            // Requirement says: "Passwords are stored and verified using SHA-256 hashing."
            // We'll implement a helper for hash comparison.
            if (this.verifyPassword(password, u['Password'])) {
                user = u;
                break;
            }
        }
    }

    if (user) {
        // Remove password from response
        var safeUser = {};
        for (var k in user) {
            if (k !== 'Password') safeUser[k] = user[k];
        }
        // Add role if missing
        if (!safeUser.role && role === 'Mahasiswa') safeUser.role = 'Mahasiswa';

        // Map user_id for frontend consistency
        safeUser.user_id = safeUser.NIM || safeUser.ID_Staff;
        safeUser.nama = safeUser.Nama;

        return { success: true, user: safeUser };
    }

    return { success: false, message: "Email atau Password salah." };
  },

  // Register Student
  register: function(data) {
    // Data: nama_ktp, email, no_hp, password, tgl_lahir, jenis_kelamin, alamat, status_s1, kode_status, angkatan

    // 1. Check if email exists
    var users = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA);
    for (var i = 0; i < users.length; i++) {
        if (users[i].Email === data.email) {
            return { success: false, message: "Email already registered" };
        }
    }

    // 2. Generate NIM
    // Format: DI.{Gender}.{Thn}.{Angkatan}.{KodeStatus}.{Urut}
    // Gender: IN (Laki), AT (Perempuan) from data.jenis_kelamin
    // Thn: 2 digit year (25)
    // Angkatan: data.angkatan (e.g. 07)
    // KodeStatus: data.kode_status (RGR, FAA, RPL, ADM)

    var genderCode = (data.jenis_kelamin === 'IN') ? 'IN' : 'AT';
    var date = new Date();
    var yearTwoDigit = date.getFullYear().toString().slice(-2);
    var angkatan = data.angkatan || '07'; // Default if missing
    var statusCode = data.kode_status || 'RGR';

    var prefix = Config.PREFIX.MAHASISWA + "." + genderCode + "." + yearTwoDigit + "." + angkatan + "." + statusCode;

    // Lock for NIM Generation
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
        // Re-read data to get latest sequence in case of race condition (though we have getAll, for sequence we might need to be careful)
        // Optimization: Filter users with same prefix to find max sequence
        var currentUsers = Database.getAll(Config.SHEET_NAMES.USERS_MAHASISWA);
        var maxSeq = 0;

        currentUsers.forEach(function(u) {
            if (u.NIM && u.NIM.startsWith(prefix)) {
                var parts = u.NIM.split('.');
                var seq = parseInt(parts[parts.length - 1]);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        });

        var nextSeq = maxSeq + 1;
        var seqStr = ("0000" + nextSeq).slice(-4);
        var nim = prefix + "." + seqStr;

        // 3. Prepare Data Row
        // Header: NIM, Email, Password, Nama, WA, Gender, TempatLahir, TglLahir, Alamat, Angkatan, Mustawa, Status_Akademik, Klasifikasi, Status_S1, NIM_Lama, Foto_URL

        var hashedPassword = this.hashPassword(data.password);

        var newUser = {
            NIM: nim,
            Email: data.email,
            Password: hashedPassword,
            Nama: data.nama_ktp,
            WA: data.no_hp,
            Gender: data.jenis_kelamin,
            TempatLahir: (data.tgl_lahir || "").split(',')[0], // Simple split logic
            TglLahir: (data.tgl_lahir || "").split(',')[1] || data.tgl_lahir,
            Alamat: data.alamat,
            Angkatan: angkatan,
            Mustawa: '01', // Default Mustawa 1
            Status_Akademik: 'Non-Aktif', // Pending Payment
            Klasifikasi: statusCode,
            Status_S1: data.status_s1,
            NIM_Lama: data.nim_lama || "",
            Foto_URL: ""
        };

        Database.insert(Config.SHEET_NAMES.USERS_MAHASISWA, newUser);

        return { success: true, data: { nim: nim, user_id: nim } };

    } catch(e) {
        return { success: false, message: e.message };
    } finally {
        lock.releaseLock();
    }
  },

  // Helper for Hashing (Mockable)
  hashPassword: function(raw) {
      if (typeof Utilities !== 'undefined') {
          var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
          return digest.map(function(b) { return ("0" + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join("");
      } else {
          return "HASH_" + raw; // For local test
      }
  },

  verifyPassword: function(raw, hashed) {
      if (typeof Utilities !== 'undefined') {
          return this.hashPassword(raw) === hashed;
      } else {
          return "HASH_" + raw === hashed;
      }
  }
};

if (typeof module !== 'undefined') module.exports = Auth;
