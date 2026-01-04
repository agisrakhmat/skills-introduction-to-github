var Auth = {
  /**
   * Registers a new student.
   * Default Password Logic: 4 digit terakhir dari phone.
   */
  registerStudent: function(data) {
    // Validasi input minimal
    if (!data.email || !data.full_name || !data.phone) {
      return { success: false, message: 'Email, Nama, dan No. HP wajib diisi.' };
    }

    if (typeof Database === 'undefined') {
      // Check if we are in node environment and try to require it if missing?
      // Or just assume it should be global/imported.
      // In GAS it is global. In Node test it is required but we need to pass it or make it global.
      // Let's assume the caller makes it available or we fix the test.
      // For now, I will fix the test setup to make Database global or imported here if possible?
      // But `require` is not available in GAS.

      // Better fix: In test_logic.js, assign Database to global or pass it.
      // But here, let's just use it assuming it exists.
      // The issue is in Node context, Auth.js sees its own scope.
      // We can try to grab it from global if it exists there, or expect it to be passed.
      // But standard GAS pattern relies on global scope.
    }

    // Check duplication
    const users = Database.getTable(SHEET_NAMES.USERS) || [];
    const exists = users.find(u => u.email === data.email || u.phone === data.phone);
    if (exists) {
      return { success: false, message: 'User dengan email atau nomor HP tersebut sudah terdaftar.' };
    }

    // Generate ID (Simple timestamp based for now, or could use UUID lib if available)
    const userId = 'U' + new Date().getTime();

    // Default Password: 4 digit terakhir phone
    // Normalize phone first? Spec says "Nomor WA". Assuming string input.
    // e.g., "081234567890" -> "7890"
    let cleanPhone = data.phone.replace(/\D/g, ''); // remove non-digits
    let password = cleanPhone.slice(-4);

    // Hash password using SHA-256
    let passwordHash = '';
    if (typeof Utilities !== 'undefined') {
      const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
      // Convert byte array to hex string
      passwordHash = rawHash.map(function(byte) {
        // Handle negative bytes and ensure 2 chars
        var v = (byte < 0 ? byte + 256 : byte).toString(16);
        return v.length == 1 ? "0" + v : v;
      }).join("");
    } else {
      // Fallback for local node testing if Utilities is not mocked (though we should mock it)
      passwordHash = 'MOCK_HASH_' + password;
    }

    const newUser = {
      user_id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: cleanPhone,
      role: 'STUDENT',
      status: 'ACTIVE',
      password_hash: passwordHash
    };

    Database.insert(SHEET_NAMES.USERS, newUser);

    return { success: true, message: 'Registrasi berhasil.', data: newUser };
  },

  /**
   * Login user.
   */
  login: function(identifier, password) {
    const users = Database.getTable(SHEET_NAMES.USERS);
    // Identifier can be email or phone
    const user = users.find(u => u.email === identifier || u.phone === identifier);

    if (!user) {
      return { success: false, message: 'User tidak ditemukan.' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, message: 'Akun tidak aktif.' };
    }

    // Verify password
    let inputHash = '';
    if (typeof Utilities !== 'undefined') {
      const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
      inputHash = rawHash.map(function(byte) {
        var v = (byte < 0 ? byte + 256 : byte).toString(16);
        return v.length == 1 ? "0" + v : v;
      }).join("");
    } else {
      inputHash = 'MOCK_HASH_' + password;
    }

    if (user.password_hash === inputHash) {
      return { success: true, message: 'Login berhasil.', user: user };
    } else {
      return { success: false, message: 'Password salah.' };
    }
  }
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { Auth };
}
