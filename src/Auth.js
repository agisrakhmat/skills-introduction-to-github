// Auth.js - Authentication Logic

/**
 * Handles student login.
 * @param {string} email
 * @param {string} password
 * @return {Object} { success: boolean, message: string, email: string }
 */
function loginStudent(email, password) {
  // Use the centralized database finder
  const user = findRow('USERS', 'email', email);

  if (!user) {
    return { success: false, message: 'Email tidak ditemukan.' };
  }

  if (user.role !== 'STUDENT') {
    return { success: false, message: 'Akun ini bukan akun mahasiswa.' };
  }

  if (user.status !== 'ACTIVE') {
     return { success: false, message: 'Akun tidak aktif.' };
  }

  // Verify Password
  // In real app: Compare hashes.
  // user.password_hash matches computed hash of input.
  const inputHash = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
  );

  // For the Mock Seed, we manually set the hash for '7890'.
  // If the seed was generated with the same utility, this works.

  if (user.password_hash === inputHash) {
    return { success: true, email: user.email };
  } else {
    return { success: false, message: 'Password salah.' };
  }
}
