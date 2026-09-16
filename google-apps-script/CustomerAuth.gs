/** Email OTP. Order numbers are identifiers, never credentials. */
const CustomerAuth = {
  request: function(email) {
    email = String(email || '').trim().toLowerCase();
    if (email.length > 254 || !Utils.isValidEmail(email)) return { success: false, error: 'Format email tidak valid.' };
    var delivery = null;
    const result = Security.locked(function() {
      Security.cleanup();
      if (!Security.consume('otp-global', 60, 3600000) ||
          !Security.consume('otp-mail-hour:' + email, 5, 3600000) ||
          !Security.consume('otp-mail-minute:' + email, 1, 60000))
        return { success: false, error: 'Permintaan terlalu sering. Tunggu sebelum mencoba kembali.', code: 'RATE_LIMIT' };
      const data = Config.getSheet('Customers').getDataRange().getValues();
      const customer = data.slice(1).find(function(r) { return String(r[2]).trim().toLowerCase() === email; });
      const challengeId = Security.random();
      const code = ('00000000' + (parseInt(Security.random().slice(0, 12), 16) % 100000000)).slice(-8);
      const emailHash = Security.hash(email);
      const previous = Security.read('latest_' + emailHash);
      if (previous) Security.remove('otp_' + previous.challengeId);
      const expiresAt = Date.now() + 10 * 60000;
      Security.write('otp_' + challengeId, {
        customerId: customer ? String(customer[0]) : '', email: email,
        name: customer ? String(customer[1]) : '', codeHash: Security.mac(challengeId + ':' + code),
        attempts: 0, expiresAt: expiresAt
      });
      Security.write('latest_' + emailHash, { challengeId: challengeId, expiresAt: expiresAt });
      if (customer) delivery = { email: email, code: code, challengeId: challengeId };
      return { success: true, data: { challengeId: challengeId, expiresAt: expiresAt, retryAfter: 60 },
        message: 'Jika email terdaftar, kode verifikasi telah dikirim. Periksa inbox dan folder spam.' };
    });
    if (delivery) {
      try {
        GmailApp.sendEmail(delivery.email, 'Kode login Kastriva',
          'Kode login Anda: ' + delivery.code + '\n\nBerlaku 10 menit dan hanya dapat dipakai sekali. Jangan bagikan kode ini kepada siapa pun.\nJika Anda tidak meminta login, abaikan email ini.', { name: Config.APP_NAME });
      } catch (e) {
        Security.remove('otp_' + delivery.challengeId);
        // Keep the same public response to avoid revealing registered addresses.
        Logger.log('OTP delivery failed. Check Gmail authorization/quota.');
      }
    }
    return result;
  },
  verifyCode: function(data) {
    return Security.locked(function() {
      if (!Security.consume('otp-verify-global', 100, 60000))
        return { success: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.', code: 'RATE_LIMIT' };
      const failure = { success: false, error: 'Kode salah, sudah dipakai, atau kedaluwarsa. Minta kode baru bila diperlukan.' };
      if (!/^[a-f0-9]{64}$/.test(String(data.challengeId || ''))) return failure;
      const key = 'otp_' + data.challengeId;
      const otp = Security.read(key);
      if (!otp) return failure;
      otp.attempts++;
      const valid = /^\d{8}$/.test(String(data.code || '')) && Security.equal(otp.codeHash, Security.mac(data.challengeId + ':' + data.code));
      if (!valid || !otp.customerId) {
        if (otp.attempts >= 5) Security.remove(key); else Security.write(key, otp);
        return failure;
      }
      // Confirm the account still owns this address before creating a session.
      const rows = Config.getSheet('Customers').getDataRange().getValues();
      const exists = rows.slice(1).some(function(r) { return String(r[0]) === otp.customerId && String(r[2]).trim().toLowerCase() === otp.email; });
      Security.remove(key);
      if (!exists) return failure;
      if (data.previousToken) Security.logout(data.previousToken);
      return Security.newSession('customer', { customerId: otp.customerId, email: otp.email, name: otp.name }, data.remember === true);
    });
  },
  verify: function(token) { return Security.verifySession(token, 'customer'); },
  logout: function(token) { return Security.logout(token); }
};
