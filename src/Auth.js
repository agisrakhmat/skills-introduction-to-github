// --- Auth.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }
if (typeof Users === 'undefined') { try { var Users = require('./Users'); } catch(e) {} }

var Auth = {

  hashPassword: function(password) {
    if (typeof Utilities !== 'undefined' && Utilities.computeDigest) {
        var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
        var txtHash = "";
        for (var i = 0; i < rawHash.length; i++) {
          var hashVal = rawHash[i];
          if (hashVal < 0) hashVal += 256;
          if (hashVal.toString(16).length == 1) txtHash += '0';
          txtHash += hashVal.toString(16);
        }
        return txtHash;
    } else {
        return "MOCK_HASH_" + password;
    }
  },

  registerStudent: function(data) {
    // data matches frontend payload:
    // { nama_ktp, email, no_hp, password, tgl_lahir, jenis_kelamin, alamat, status_s1, nim_lama, angkatan, kode_status }

    try {
        var lock = LockService.getScriptLock();
        var hasLock = lock.tryLock(10000);

        if (!hasLock) {
            return { success: false, message: "Server sibuk, silakan coba lagi." };
        }

        // 1. Validate Uniqueness
        // Map frontend keys to backend expectations
        var email = data.email || data.Email;
        var noWa = data.no_hp || data.NoWA;

        var existing = Users.findUserByEmailOrWA(email, noWa, Config.ROLES.MAHASISWA);
        if (existing) {
          lock.releaseLock();
          // Frontend expects { status: 'error', message: ... } or custom handling
          // But our standard is { success: false }. Frontend logic handles this.
          // Note: Frontend handles "Email already registered" specifically.
          return { success: false, message: "Email already registered", data: { user_id: existing.NIM, nim: existing.NIM } };
        }

        // 2. Generate Password
        var rawPass = data.password || noWa.replace(/[^0-9]/g, '').slice(-4);
        var passHash = this.hashPassword(rawPass);

        // 3. Generate NIM
        var gender = (data.jenis_kelamin === 'L' || data.jenis_kelamin === 'IN') ? 'IN' : 'AT';
        var angkatan = data.angkatan || "07";
        var status = data.kode_status || "RGR";

        var nim = Users.generateNIM(gender, angkatan, status);

        // 4. Prepare Record
        var newStudent = {
          "NIM": nim,
          "Nama": data.nama_ktp || data.Nama,
          "Email": email,
          "NoWA": noWa,
          "Password_Hash": passHash,
          "Gender": gender,
          "Tahun_Masuk": new Date().getFullYear(),
          "Kode_Angkatan": angkatan,
          "Status_Klasifikasi": status,
          "Mustawa_Saat_Ini": "01", // Default, will be updated by Enroll
          "Status_Aktif": "Aktif",
          "Tgl_Daftar": Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
          // New Fields
          "Alamat": data.alamat || "",
          "Tgl_Lahir": data.tgl_lahir || "",
          "Status_S1": data.status_s1 || "",
          "NIM_Lama": data.nim_lama || ""
        };

        // 5. Save
        Users.createUser(newStudent, Config.ROLES.MAHASISWA);

        lock.releaseLock();

        return {
          success: true,
          status: "success", // For frontend compatibility
          message: "Pendaftaran berhasil.",
          data: {
              user_id: nim,
              nim: nim,
              password: rawPass,
              NIM: nim, // redundancy for safety
              Password: rawPass
          }
        };

    } catch (e) {
        try { LockService.getScriptLock().releaseLock(); } catch(e2) {}
        return { success: false, status: "error", message: "Error sistem: " + e.toString() };
    }
  },

  login: function(identifier, password, role) {
    var sheetName = (role === Config.ROLES.MAHASISWA) ?
                    Config.SHEETS.USERS_MAHASISWA :
                    Config.SHEETS.USERS_STAFF;

    var users = Database.getTable(sheetName);
    var targetUser = null;
    var idLower = identifier.toLowerCase().trim();

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (u.Email && u.Email.toLowerCase().trim() === idLower) {
            targetUser = u; break;
        }
        var pk = u.NIM || u.Kode_Staff;
        if (pk && pk.toLowerCase() === idLower) {
            targetUser = u; break;
        }
    }

    if (!targetUser) return { success: false, message: "User tidak ditemukan." };

    var inputHash = this.hashPassword(password);
    if (targetUser.Password_Hash !== inputHash) {
        return { success: false, message: "Password salah." };
    }

    return {
        success: true,
        message: "Login berhasil",
        user: {
            id: targetUser.NIM || targetUser.Kode_Staff,
            nama: targetUser.Nama,
            role: role
        }
    };
  }
};

if (typeof module !== 'undefined') module.exports = Auth;
