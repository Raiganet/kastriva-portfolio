/** Stage 1: signed gateway, persistent rate limits and hashed sessions. */
const Security = {
  props: function() { return PropertiesService.getScriptProperties(); },
  secret: function() {
    const s = this.props().getProperty('GAS_BRIDGE_SECRET') || '';
    if (s.length < 32) throw new Error('Security setup required');
    return s;
  },
  hex: function(bytes) { return bytes.map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join(''); },
  hash: function(value) { return this.hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)); },
  mac: function(value) { return this.hex(Utilities.computeHmacSha256Signature(String(value), this.secret(), Utilities.Charset.UTF_8)); },
  equal: function(a, b) {
    a = String(a || ''); b = String(b || '');
    if (a.length !== b.length) return false;
    var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
  },
  random: function() { return this.mac(Utilities.getUuid() + ':' + Utilities.getUuid() + ':' + Date.now()); },
  locked: function(fn) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Server busy');
    try { return fn(); } finally { lock.releaseLock(); }
  },
  read: function(key) {
    const raw = this.props().getProperty('sec_' + key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value.expiresAt || value.expiresAt <= Date.now()) { this.remove(key); return null; }
    return value;
  },
  write: function(key, value) { this.props().setProperty('sec_' + key, JSON.stringify(value)); },
  remove: function(key) { this.props().deleteProperty('sec_' + key); },
  cleanup: function() {
    const props = this.props(); const all = props.getProperties(); const now = Date.now();
    Object.keys(all).filter(function(k) { return k.indexOf('sec_') === 0; }).forEach(function(k) {
      try { if (JSON.parse(all[k]).expiresAt <= now) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); }
    });
  },
  // Call only inside locked(). Persistent counters cannot be evicted like CacheService.
  consume: function(key, limit, windowMs) {
    const name = 'rate_' + this.hash(key);
    const value = this.read(name) || { count: 0, expiresAt: Date.now() + windowMs };
    if (value.count >= limit) return false;
    value.count++; this.write(name, value); return true;
  },
  verifyEnvelope: function(envelope) {
    if (!envelope || typeof envelope.payload !== 'string' || envelope.payload.length > 100000 ||
        !Number.isFinite(envelope.timestamp) || Math.abs(Date.now() - envelope.timestamp) > 60000 ||
        !/^[a-f0-9-]{36}$/.test(envelope.nonce || '') || !/^[a-f0-9]{64}$/.test(envelope.signature || '')) return null;
    const expected = this.mac(envelope.timestamp + '.' + envelope.nonce + '.' + envelope.payload);
    if (!this.equal(expected, envelope.signature)) return null;
    return this.locked(function() {
      Security.cleanup();
      const key = 'nonce_' + Security.hash(envelope.nonce);
      if (Security.read(key)) return null;
      // Bound nonce storage under load; fail closed once the gateway budget is exhausted.
      if (!Security.consume('gateway-global', 180, 60000)) return null;
      Security.write(key, { expiresAt: Date.now() + 125000 });
      return JSON.parse(envelope.payload);
    });
  },
  newSession: function(role, identity, remember) {
    const token = this.random();
    const session = Object.assign({}, identity, { role: role, expiresAt: Date.now() + (remember ? 86400000 : 7200000) });
    // One active session per identity; re-login revokes the previous device session.
    const owner = 'owner_' + role + '_' + this.hash(identity.customerId || identity.email);
    const old = this.read(owner); if (old) this.remove('session_' + old.tokenHash);
    const tokenHash = this.hash(token);
    this.write('session_' + tokenHash, session);
    this.write(owner, { tokenHash: tokenHash, expiresAt: session.expiresAt });
    return { success: true, data: Object.assign({ token: token }, session) };
  },
  verifySession: function(token, role) {
    if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return { success: false, error: 'Sesi berakhir. Silakan login kembali.', code: 'UNAUTHORIZED' };
    const s = this.read('session_' + this.hash(token));
    if (!s || s.role !== role) return { success: false, error: 'Sesi berakhir. Silakan login kembali.', code: 'UNAUTHORIZED' };
    return { success: true, data: s };
  },
  logout: function(token) {
    if (token) this.remove('session_' + this.hash(token));
    return { success: true };
  }
};

/** Run once after configuring Script Properties. Invalidates legacy sessions. */
function setupSecurityStage1() {
  Security.secret();
  Security.props().deleteProperty('sessions');
  Security.props().deleteProperty('customerSessions');
  Security.cleanup();
  const exists = ScriptApp.getProjectTriggers().some(function(t) { return t.getHandlerFunction() === 'cleanupSecurityStage1'; });
  if (!exists) ScriptApp.newTrigger('cleanupSecurityStage1').timeBased().everyHours(1).create();
  Logger.log('Stage 1 security ready. Legacy sessions revoked.');
}
function cleanupSecurityStage1() { Security.locked(function() { Security.cleanup(); }); }
/** Emergency session/OTP revocation; run manually after a suspected compromise. */
function revokeAllSessionsStage1() {
  Security.locked(function() {
    const p = Security.props();
    Object.keys(p.getProperties()).forEach(function(k) {
      if (/^sec_(session_|owner_|otp_|latest_)/.test(k)) p.deleteProperty(k);
    });
    p.deleteProperty('sessions'); p.deleteProperty('customerSessions');
  });
}
