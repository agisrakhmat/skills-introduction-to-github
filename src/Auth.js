// --- Auth.js ---
if (typeof Config === 'undefined') { try { var Config = require('./Config'); } catch(e) {} }
if (typeof Database === 'undefined') { try { var Database = require('./Database'); } catch(e) {} }
if (typeof Users === 'undefined') { try { var Users = require('./Users'); } catch(e) {} }

var Auth = {

  hashPassword: function(password) {
    // Check if Utilities is available (GAS)
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
        // Node.js fallback (Simulated)
        return "MOCK_HASH_" + password;
    }
  },

  registerStudent: function(data) {
    // data: { Nama, Email, NoWA, Gender, Status (RGR/FAA), AngkatanCode }

    try {
        // Use LockService to prevent race conditions (Duplicate NIMs)
        var lock = LockService.getScriptLock();
        var hasLock = lock.tryLock(10000); // Wait up to 10s

        if (!hasLock) {
            return { success: false, message: "Server sibuk, silakan coba lagi." };
        }

        // CRITICAL SECTION START

        // 1. Validate Uniqueness
        var existing = Users.findUserByEmailOrWA(data.Email, data.NoWA, Config.ROLES.MAHASISWA);
        if (existing) {
          lock.releaseLock();
          return { success: false, message: "Email atau No WA sudah terdaftar." };
        }

        // 2. Generate Password
        var cleanWA = data.NoWA.replace(/[^0-9]/g, '');
        var rawPass = cleanWA.slice(-4);
        if (rawPass.length < 4) rawPass = "1234";
        var passHash = this.hashPassword(rawPass);

        // 3. Generate NIM (Must be inside Lock)
        var nim = Users.generateNIM(data.Gender, data.AngkatanCode || "07", data.Status || "RGR");

        // 4. Prepare Record
        var newStudent = {
          "NIM": nim,
          "Nama": data.Nama,
          "Email": data.Email,
          "NoWA": data.NoWA,
          "Password_Hash": passHash,
          "Gender": (data.Gender === 'IN' || data.Gender === 'Laki-laki') ? 'IN' : 'AT',
          "Tahun_Masuk": new Date().getFullYear(),
          "Kode_Angkatan": data.AngkatanCode || "07",
          "Status_Klasifikasi": data.Status || "RGR",
          "Mustawa_Saat_Ini": "01",
          "Status_Aktif": "Aktif",
          "Tgl_Daftar": Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd")
        };

        // 5. Save
        Users.createUser(newStudent, Config.ROLES.MAHASISWA);

        // CRITICAL SECTION END
        lock.releaseLock();

        return {
          success: true,
          message: "Pendaftaran berhasil.",
          data: { NIM: nim, Password: rawPass }
        };

    } catch (e) {
        // Ensure lock is released even if error
        try { LockService.getScriptLock().releaseLock(); } catch(e2) {}
        return { success: false, message: "Error sistem: " + e.toString() };
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
