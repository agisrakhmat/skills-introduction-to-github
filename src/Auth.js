var Auth = {
  // Logic: Default Password is last 4 digits of phone
  generateDefaultPassword: function(phone) {
    if (!phone || phone.length < 4) return "1234"; // Fallback
    // Ensure clean phone
    var cleanPhone = phone.toString().replace(/\D/g, '');
    return cleanPhone.substring(cleanPhone.length - 4);
  },

  registerStudent: function(email, fullName, phone) {
    // 1. Normalize Phone
    var normPhone = Utils.normalizePhone(phone);

    // 2. Generate Password
    var plainPassword = this.generateDefaultPassword(normPhone);
    var passwordHash = Utils.hashPassword(plainPassword);

    // 3. Create User Object (mocking DB insertion here)
    var newUser = {
      user_id: Utils.generateId(),
      email: email,
      full_name: fullName,
      phone: normPhone,
      role: "STUDENT",
      status: "ACTIVE",
      password_hash: passwordHash
    };

    return newUser; // In real app, save to DB
  },

  login: function(identifier, password, userRecord) {
    // userRecord is fetched from DB based on email or phone
    if (!userRecord) return false;

    var inputHash = Utils.hashPassword(password);
    return inputHash === userRecord.password_hash;
  }
};

if (typeof module !== "undefined") {
  module.exports = Auth;
}
