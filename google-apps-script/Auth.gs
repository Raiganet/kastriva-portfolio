/** Password verification runs on the trusted Next.js server using scrypt. */
const Auth = {
  attempt: function() {
    return Security.locked(function() {
      if (!Security.consume('admin-login-global', 10, 15 * 60000))
        return { success: false, error: 'Terlalu banyak percobaan. Tunggu 15 menit.', code: 'RATE_LIMIT' };
      return { success: true };
    });
  },
  login: function(data) {
    if (data.passwordVerified !== true || typeof data.email !== 'string')
      return { success: false, error: 'Email atau password salah.' };
    return Security.locked(function() {
      if (data.previousToken) Security.logout(data.previousToken);
      return Security.newSession('admin', { email: data.email }, data.remember === true);
    });
  },
  verifyToken: function(token) { return Security.verifySession(token, 'admin'); },
  logout: function(token) { return Security.logout(token); }
};
